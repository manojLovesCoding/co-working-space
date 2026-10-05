import Space from "../models/Space.js";
import { v2 as cloudinary } from "cloudinary";

const SPACE_GROUPS = {
  Workspace: {
    prefix: "WS",
    max: 45,
  },

  "Team Leads Cubicle": {
    prefix: "TLC",
    max: 4,
  },

  "Senior Leads Cubicle": {
    prefix: "SLC",
    max: 3,
  },

  "Manager Cubicle": {
    prefix: "MC",
    max: 2,
  },

  "Video Conferencing": {
    prefix: "VC",
    max: 1,
  },

  "Executive Cabin": {
    prefix: "EC",
    max: 2,
  },

  "CEO Cabin": {
    prefix: "CD",
    max: 1,
  },
};

const generateNextSpaceCode = async (spaceName) => {
  const group = SPACE_GROUPS[spaceName];

  if (!group) {
    return null;
  }

  const spaces = await Space.find({
    space: spaceName,
  })
    .select("spaceCode")
    .lean();

  const usedNumbers = spaces
    .map((space) => {
      const number = space.spaceCode.replace(
        group.prefix,
        ""
      );

      return Number(number);
    })
    .filter((number) => !Number.isNaN(number))
    .sort((a, b) => a - b);

  let next = 1;

  for (const number of usedNumbers) {
    if (number === next) {
      next++;
    } else if (number > next) {
      break;
    }
  }

  if (next > group.max) {
    return null;
  }

  return `${group.prefix}${String(next).padStart(2, "0")}`;
};

export const createSpace = async (req, res) => {
  let uploadedImage = null;

  try {
    const {
      space,
      perHour,
      perDay,
      oneWeek,
      twoWeeks,
      threeWeeks,
      perMonth,
      minDuration,
      minDurationDesc,
      maxDuration,
      maxDurationDesc,
      status,
    } = req.body;

    /*
     * Validate space type.
     */
    if (!space) {
      return res.status(400).json({
        success: false,
        message: "Space type is required",
      });
    }

    if (!SPACE_GROUPS[space]) {
      return res.status(400).json({
        success: false,
        message: "Invalid space type",
      });
    }

    /*
     * Validate rates.
     */
    if (
      (perHour === undefined || perHour === "") &&
      (perDay === undefined || perDay === "") &&
      (perMonth === undefined || perMonth === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one rate is required",
      });
    }

    /*
     * Image is required when creating
     * a new space.
     */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Space image is required",
      });
    }

    /*
     * Generate space code.
     */
    const spaceCode = await generateNextSpaceCode(space);

    if (!spaceCode) {
      return res.status(400).json({
        success: false,
        message: `${space} limit has been reached`,
      });
    }

    /*
     * Duplicate safety check.
     */
    const existingSpace = await Space.findOne({
      spaceCode,
    });

    if (existingSpace) {
      return res.status(400).json({
        success: false,
        message: `Space code ${spaceCode} already exists`,
      });
    }

    /*
     * Upload image to Cloudinary.
     *
     * req.file.buffer contains the uploaded
     * image because multer memoryStorage is used.
     */
    uploadedImage = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "spaces",
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
    });

    /*
     * Create MongoDB document.
     */
    const newSpace = await Space.create({
      spaceCode,

      space,

      perHour:
        perHour !== undefined && perHour !== ""
          ? Number(perHour)
          : null,

      perDay:
        perDay !== undefined && perDay !== ""
          ? Number(perDay)
          : null,

      oneWeek:
        oneWeek !== undefined && oneWeek !== ""
          ? Number(oneWeek)
          : null,

      twoWeeks:
        twoWeeks !== undefined && twoWeeks !== ""
          ? Number(twoWeeks)
          : null,

      threeWeeks:
        threeWeeks !== undefined && threeWeeks !== ""
          ? Number(threeWeeks)
          : null,

      perMonth:
        perMonth !== undefined && perMonth !== ""
          ? Number(perMonth)
          : null,

      minDuration:
        minDuration !== undefined && minDuration !== ""
          ? Number(minDuration)
          : null,

      minDurationDesc: minDurationDesc || "",

      maxDuration:
        maxDuration !== undefined && maxDuration !== ""
          ? Number(maxDuration)
          : null,

      maxDurationDesc: maxDurationDesc || "",

      /*
       * IMPORTANT:
       * Store Cloudinary secure URL,
       * NOT req.file.path.
       */
      image: uploadedImage.secure_url,

      status: status || "Active",

      createdBy: req.user.id,
    });

    /*
     * Success response.
     */
    return res.status(201).json({
      success: true,
      message: "Space created successfully",
      space: newSpace,
    });
  } catch (error) {
    console.error("Create space error:", error);

    /*
     * If Cloudinary upload succeeded but
     * MongoDB creation failed, remove the
     * uploaded image from Cloudinary.
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
     * Duplicate key error.
     */
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Space code already exists",
      });
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

    /*
     * General server error.
     */
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





export const getSpaces = async (req, res) => {
  try {
    const spaces = await Space.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      spaces,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCloudinaryPublicId = (imageUrl) => {
  try {
    if (!imageUrl) {
      return null;
    }

    const url = new URL(imageUrl);

    const parts = url.pathname.split("/");

    const uploadIndex =
      parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    /*
     * Everything after "upload" can contain:
     *
     * v123456/spaces/image.jpg
     *
     * Remove version if present.
     */
    let publicParts =
      parts.slice(uploadIndex + 1);

    if (
      publicParts[0]?.startsWith("v") &&
      /^\d+$/.test(
        publicParts[0].substring(1)
      )
    ) {
      publicParts.shift();
    }

    const fileName =
      publicParts.pop();

    if (!fileName) {
      return null;
    }

    const nameWithoutExtension =
      fileName.replace(
        /\.[^/.]+$/,
        ""
      );

    publicParts.push(
      nameWithoutExtension
    );

    return publicParts.join("/");
  } catch (error) {
    console.error(
      "Failed to extract Cloudinary public ID:",
      error.message
    );

    return null;
  }
};


export const updateSpace = async (req, res) => {
  let uploadedImage = null;

  try {
    const { id } = req.params;

    /*
     * Find existing space.
     */
    const space = await Space.findById(id);

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    const {
      space: spaceName,
      perHour,
      perDay,
      oneWeek,
      twoWeeks,
      threeWeeks,
      perMonth,
      minDuration,
      minDurationDesc,
      maxDuration,
      maxDurationDesc,
      status,
    } = req.body;

    /*
     * Validate space type if supplied.
     */
    if (spaceName !== undefined) {
      if (!SPACE_GROUPS[spaceName]) {
        return res.status(400).json({
          success: false,
          message: "Invalid space type",
        });
      }

      space.space = spaceName;
    }

    /*
     * Calculate resulting rates.
     *
     * Empty string means the user wants to
     * clear that particular rate.
     */
    const updatedPerHour =
      perHour !== undefined
        ? perHour
        : space.perHour;

    const updatedPerDay =
      perDay !== undefined
        ? perDay
        : space.perDay;

    const updatedPerMonth =
      perMonth !== undefined
        ? perMonth
        : space.perMonth;

    /*
     * At least one main rate must exist.
     */
    if (
      (updatedPerHour === null ||
        updatedPerHour === "") &&
      (updatedPerDay === null ||
        updatedPerDay === "") &&
      (updatedPerMonth === null ||
        updatedPerMonth === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one rate is required",
      });
    }

    /*
     * Update pricing fields.
     */
    if (perHour !== undefined) {
      space.perHour =
        perHour === "" ? null : Number(perHour);
    }

    if (perDay !== undefined) {
      space.perDay =
        perDay === "" ? null : Number(perDay);
    }

    if (oneWeek !== undefined) {
      space.oneWeek =
        oneWeek === "" ? null : Number(oneWeek);
    }

    if (twoWeeks !== undefined) {
      space.twoWeeks =
        twoWeeks === "" ? null : Number(twoWeeks);
    }

    if (threeWeeks !== undefined) {
      space.threeWeeks =
        threeWeeks === "" ? null : Number(threeWeeks);
    }

    if (perMonth !== undefined) {
      space.perMonth =
        perMonth === "" ? null : Number(perMonth);
    }

    /*
     * Update duration fields.
     */
    if (minDuration !== undefined) {
      space.minDuration =
        minDuration === ""
          ? null
          : Number(minDuration);
    }

    if (minDurationDesc !== undefined) {
      space.minDurationDesc = minDurationDesc;
    }

    if (maxDuration !== undefined) {
      space.maxDuration =
        maxDuration === ""
          ? null
          : Number(maxDuration);
    }

    if (maxDurationDesc !== undefined) {
      space.maxDurationDesc = maxDurationDesc;
    }

    /*
     * Update status.
     */
    if (status !== undefined) {
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      space.status = status;
    }

    /*
     * IMAGE UPDATE
     *
     * Only upload if the user selected
     * a new image.
     */
    if (req.file) {
      uploadedImage = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "spaces",
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
      space.image =
        uploadedImage.secure_url;
    }

    /*
     * Save MongoDB document.
     */
    await space.save();

    /*
     * Delete old Cloudinary image only
     * AFTER MongoDB update succeeds.
     *
     * This prevents losing the old image if
     * MongoDB save fails.
     */
    if (
      req.file &&
      uploadedImage?.public_id
    ) {
      try {
        /*
         * We need the old image's public ID.
         *
         * Existing database stores only the
         * secure URL, so extract public ID from
         * the old URL.
         */
        const oldImageUrl = req.body.oldImageUrl;

        if (oldImageUrl) {
          const oldPublicId =
            getCloudinaryPublicId(
              oldImageUrl
            );

          if (oldPublicId) {
            await cloudinary.uploader.destroy(
              oldPublicId
            );
          }
        }
      } catch (cleanupError) {
        console.error(
          "Old image cleanup failed:",
          cleanupError.message
        );
      }
    }

    /*
     * Success.
     */
    return res.status(200).json({
      success: true,
      message: "Space updated successfully",
      space,
    });
  } catch (error) {
    console.error(
      "Update space error:",
      error
    );

    /*
     * If new image was uploaded but
     * MongoDB update failed, remove the
     * new image from Cloudinary.
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

    /*
     * Invalid MongoDB ObjectId.
     */
    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid space ID",
      });
    }

    /*
     * Duplicate space code.
     */
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Space code already exists",
      });
    }

    /*
     * General server error.
     */
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



