import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

/*
 * Get logged-in user's profile
 */
export const getProfile = async (req, res) => {
  try {
    /*
     * req.user.id comes from verifyToken middleware.
     */
    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/*
 * Helper function to extract Cloudinary
 * public ID from an existing image URL.
 */
const getCloudinaryPublicId = (imageUrl) => {
  try {
    if (!imageUrl) {
      return null;
    }

    const url = new URL(imageUrl);

    const parts = url.pathname.split("/");

    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    let publicParts = parts.slice(uploadIndex + 1);

    /*
     * Remove Cloudinary version.
     *
     * Example:
     * v123456789/profile-pics/image.jpg
     */
    if (
      publicParts[0]?.startsWith("v") &&
      /^\d+$/.test(
        publicParts[0].substring(1)
      )
    ) {
      publicParts.shift();
    }

    const fileName = publicParts.pop();

    if (!fileName) {
      return null;
    }

    const nameWithoutExtension = fileName.replace(
      /\.[^/.]+$/,
      ""
    );

    publicParts.push(nameWithoutExtension);

    return publicParts.join("/");
  } catch (error) {
    console.error(
      "Failed to extract Cloudinary public ID:",
      error.message
    );

    return null;
  }
};


/*
 * Update logged-in user's profile
 */
export const updateProfile = async (req, res) => {
  let uploadedImage = null;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldProfilePic = user.profilePic;

    const {
      name,
      phone,
      email,
      designation,
      dob,
      address,
    } = req.body;

    /*
     * Validate required fields
     */
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!designation || !designation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation is required",
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    /*
     * Check duplicate email
     */
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    /*
     * Check duplicate phone
     */
    const existingPhone = await User.findOne({
      phone: phone.trim(),
      _id: { $ne: user._id },
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is already in use",
      });
    }

    /*
     * Update profile fields
     *
     * Notice that role is NOT updated.
     */
    user.name = name.trim();

    user.phone = phone.trim();

    user.email = email
      .trim()
      .toLowerCase();

    user.designation = designation.trim();

    user.address = address.trim();

    /*
     * Date of birth
     */
    if (dob) {
      const parsedDob = new Date(dob);

      if (Number.isNaN(parsedDob.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth",
        });
      }

      user.dob = parsedDob;
    } else {
      user.dob = null;
    }

    /*
     * Upload new profile image
     */
    if (req.file) {
      uploadedImage = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "profile-pics",
                resource_type: "image",
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            )
            .end(req.file.buffer);
        }
      );

      user.profilePic =
        uploadedImage.secure_url;
    }

    /*
     * Save user
     */
    await user.save();

    /*
     * Delete OLD image only after the
     * database update succeeds.
     */
    if (
      req.file &&
      oldProfilePic &&
      uploadedImage?.secure_url !== oldProfilePic
    ) {
      try {
        const oldPublicId =
          getCloudinaryPublicId(
            oldProfilePic
          );

        if (oldPublicId) {
          await cloudinary.uploader.destroy(
            oldPublicId
          );
        }
      } catch (cleanupError) {
        console.error(
          "Old profile image cleanup failed:",
          cleanupError.message
        );
      }
    }

    /*
     * Return updated user without password.
     */
    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    /*
     * If new image was uploaded but
     * MongoDB update failed, delete the
     * newly uploaded image.
     */
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          uploadedImage.public_id
        );
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup failed:",
          cleanupError.message
        );
      }
    }

    /*
     * Duplicate key error
     */
    if (error.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      return res.status(400).json({
        success: false,
        message: `${
          duplicateField || "Field"
        } already exists`,
      });
    }

    /*
     * Mongoose validation error
     */
    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};