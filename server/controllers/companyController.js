import CompanyProfile from "../models/CompanyProfile.js";
import { v2 as cloudinary } from "cloudinary";

/*
 * Extract Cloudinary public ID from
 * the stored secure URL.
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
     * Remove Cloudinary version:
     *
     * v123456789/company/profile.jpg
     */
    if (
      publicParts[0]?.startsWith("v") &&
      /^\d+$/.test(publicParts[0].substring(1))
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
 * GET COMPANY PROFILE
 */
export const getCompanyProfile = async (req, res) => {
  try {
    const company = await CompanyProfile.findOne()
      .populate("createdBy", "name email")
      .lean();

    /*
     * No company profile created yet.
     */
    if (!company) {
      return res.status(200).json({
        success: true,
        company: null,
      });
    }

    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error(
      "Get company profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * CREATE / UPDATE COMPANY PROFILE
 *
 * This endpoint works like:
 *
 * PUT /api/company
 *
 * If company profile doesn't exist:
 *      create it
 *
 * If it already exists:
 *      update it
 */
export const saveCompanyProfile = async (req, res) => {
  let uploadedLogo = null;

  try {
    const {
      companyName,
      gstNo,
      email,
      contact,
      address,
    } = req.body;

    /*
     * Validate required fields.
     */
    if (!companyName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    if (!gstNo?.trim()) {
      return res.status(400).json({
        success: false,
        message: "GST number is required",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company email is required",
      });
    }

    if (!contact?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company contact is required",
      });
    }

    if (!address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company address is required",
      });
    }

    /*
     * Find existing company profile.
     *
     * Since this application has one company
     * profile, we only need findOne().
     */
    let company = await CompanyProfile.findOne();

    /*
     * ============================
     * CREATE NEW COMPANY PROFILE
     * ============================
     */
    if (!company) {
      /*
       * Logo is required only if you want
       * to enforce it during creation.
       *
       * Currently it is optional.
       */

      if (req.file) {
        uploadedLogo = await new Promise(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "company",
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
      }

      company = await CompanyProfile.create({
        companyName: companyName.trim(),

        gstNo: gstNo.trim().toUpperCase(),

        email: email.trim().toLowerCase(),

        contact: contact.trim(),

        address: address.trim(),

        logo: uploadedLogo?.secure_url || "",

        createdBy: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: "Company profile created successfully",
        company,
      });
    }

    /*
     * ============================
     * UPDATE EXISTING PROFILE
     * ============================
     */

    const oldLogo = company.logo;

    /*
     * Update text fields.
     */
    company.companyName = companyName.trim();

    company.gstNo = gstNo.trim().toUpperCase();

    company.email = email.trim().toLowerCase();

    company.contact = contact.trim();

    company.address = address.trim();

    /*
     * Upload new logo only when
     * user selected a new image.
     */
    if (req.file) {
      uploadedLogo = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "company",
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

      /*
       * Save new Cloudinary URL.
       */
      company.logo = uploadedLogo.secure_url;
    }

    /*
     * Save MongoDB document first.
     */
    await company.save();

    /*
     * Delete old logo only AFTER
     * MongoDB successfully saved.
     */
    if (
      req.file &&
      oldLogo &&
      uploadedLogo?.public_id
    ) {
      try {
        const oldPublicId =
          getCloudinaryPublicId(oldLogo);

        if (oldPublicId) {
          await cloudinary.uploader.destroy(
            oldPublicId
          );
        }
      } catch (cleanupError) {
        console.error(
          "Old company logo cleanup failed:",
          cleanupError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      company,
    });
  } catch (error) {
    console.error(
      "Save company profile error:",
      error
    );

    /*
     * If logo was uploaded but MongoDB
     * operation failed, remove new logo.
     */
    if (uploadedLogo?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          uploadedLogo.public_id
        );
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup failed:",
          cleanupError.message
        );
      }
    }

    /*
     * Mongoose validation error.
     */
    if (error.name === "ValidationError") {
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