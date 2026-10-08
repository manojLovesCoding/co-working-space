import CompanyProfile from "../models/CompanyProfile.js";
import { v2 as cloudinary } from "cloudinary";

/*
 * Extract Cloudinary public ID
 * from a stored secure URL.
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

    let publicParts = parts.slice(
      uploadIndex + 1
    );

    /*
     * Remove Cloudinary version.
     *
     * Example:
     * v123456/company/logo.jpg
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

    const nameWithoutExtension =
      fileName.replace(/\.[^/.]+$/, "");

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
 * ==========================================
 * GET COMPANY PROFILE
 * ==========================================
 *
 * GET /api/company
 *
 * Only returns the company belonging
 * to the currently logged-in user.
 */
export const getCompanyProfile = async (
  req,
  res
) => {
  try {
    const company =
      await CompanyProfile.findOne({
        createdBy: req.user.id,
      })
        .populate(
          "createdBy",
          "name email phone"
        )
        .lean();

    /*
     * User does not have a company yet.
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
 * ==========================================
 * CREATE / UPDATE COMPANY PROFILE
 * ==========================================
 *
 * PUT /api/company
 */
export const saveCompanyProfile = async (
  req,
  res
) => {
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
     * IMPORTANT
     *
     * Find only the company belonging
     * to the logged-in user.
     */
    let company =
      await CompanyProfile.findOne({
        createdBy: req.user.id,
      });

    /*
     * ======================================
     * CREATE COMPANY
     * ======================================
     */
    if (!company) {
      /*
       * Upload logo if provided.
       */
      if (req.file) {
        uploadedLogo =
          await new Promise(
            (resolve, reject) => {
              cloudinary.uploader
                .upload_stream(
                  {
                    folder: "company",
                    resource_type: "image",
                  },
                  (
                    error,
                    result
                  ) => {
                    if (error) {
                      reject(error);
                    } else {
                      resolve(
                        result
                      );
                    }
                  }
                )
                .end(
                  req.file.buffer
                );
            }
          );
      }

      /*
       * Create company for this user.
       */
      company =
        await CompanyProfile.create({
          companyName:
            companyName.trim(),

          gstNo: gstNo
            .trim()
            .toUpperCase(),

          email: email
            .trim()
            .toLowerCase(),

          contact: contact.trim(),

          address: address.trim(),

          logo:
            uploadedLogo?.secure_url ||
            "",

          /*
           * IMPORTANT
           *
           * This connects Company A
           * to User A.
           */
          createdBy: req.user.id,
        });

      return res.status(201).json({
        success: true,
        message:
          "Company profile created successfully",
        company,
      });
    }

    /*
     * ======================================
     * UPDATE COMPANY
     * ======================================
     */

    const oldLogo = company.logo;

    /*
     * Update normal fields.
     */
    company.companyName =
      companyName.trim();

    company.gstNo = gstNo
      .trim()
      .toUpperCase();

    company.email = email
      .trim()
      .toLowerCase();

    company.contact =
      contact.trim();

    company.address =
      address.trim();

    /*
     * Upload new logo only if
     * user selected one.
     */
    if (req.file) {
      uploadedLogo =
        await new Promise(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "company",
                  resource_type:
                    "image",
                },
                (
                  error,
                  result
                ) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(
                      result
                    );
                  }
                }
              )
              .end(
                req.file.buffer
              );
          }
        );

      company.logo =
        uploadedLogo.secure_url;
    }

    /*
     * Save company.
     */
    await company.save();

    /*
     * Delete old logo AFTER
     * MongoDB update succeeds.
     */
    if (
      req.file &&
      oldLogo &&
      uploadedLogo?.public_id
    ) {
      try {
        const oldPublicId =
          getCloudinaryPublicId(
            oldLogo
          );

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
      message:
        "Company profile updated successfully",
      company,
    });
  } catch (error) {
    console.error(
      "Save company profile error:",
      error
    );

    /*
     * Cleanup newly uploaded image
     * if MongoDB operation failed.
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
     * Duplicate key error.
     */
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "This user already has a company profile",
      });
    }

    /*
     * Mongoose validation error.
     */
    if (
      error.name ===
      "ValidationError"
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