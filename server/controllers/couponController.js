
import Coupon from "../models/couponModel.js";

/*
 * Convert YYYY-MM-DD into a UTC date.
 * Reject invalid calendar dates.
 */
const parseDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

/*
 * CREATE COUPON
 * POST /api/coupon
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      validFrom,
      validTo,
      userType,
      spaceType,
      discount,
      minimumPrice,
      maximumPrice,
      packType,
    } = req.body;

    // Required field validation
    const requiredFields = {
      couponCode,
      validFrom,
      validTo,
      userType,
      spaceType,
      discount,
      minimumPrice,
      maximumPrice,
      packType,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && !value.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Coupon code validation
    const normalizedCode = String(couponCode)
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9_-]{1,30}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code format",
      });
    }

    // Date validation
    const startDate = parseDate(validFrom);
    const endDate = parseDate(validTo);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "Valid To must be after or equal to Valid From",
      });
    }

    // Numeric validation
    const numericFields = {
      discount,
      minimumPrice,
      maximumPrice,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (
        value === "" ||
        typeof value === "boolean" ||
        !Number.isFinite(Number(value))
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid number`,
        });
      }
    }

    const discountValue = Number(discount);
    const minPrice = Number(minimumPrice);
    const maxPrice = Number(maximumPrice);

    if (discountValue < 1 || discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 1 and 100",
      });
    }

    if (minPrice < 0 || maxPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Prices cannot be negative",
      });
    }

    if (maxPrice < minPrice) {
      return res.status(400).json({
        success: false,
        message: "Maximum price must be greater than or equal to minimum price",
      });
    }

    // Check duplicate coupon
    const existingCoupon = await Coupon.findOne({
      couponCode: normalizedCode,
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Create coupon
    const coupon = await Coupon.create({
      couponCode: normalizedCode,
      validFrom: startDate,
      validTo: endDate,
      userType,
      spaceType,
      discount: discountValue,
      minimumPrice: minPrice,
      maximumPrice: maxPrice,
      packType,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });

  } catch (error) {
    console.error("Create coupon error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating coupon",
    });
  }
};


// GET ALL COUPONS
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get coupons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
};

// UPDATE COUPON
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      couponCode,
      validFrom,
      validTo,
      userType,
      spaceType,
      discount,
      minimumPrice,
      maximumPrice,
      packType,
      status,
    } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const normalizedCode = String(
      couponCode ?? coupon.couponCode
    ).trim().toUpperCase();

    if (!/^[A-Z0-9_-]{1,30}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code format",
      });
    }

    const existingCoupon = await Coupon.findOne({
      couponCode: normalizedCode,
      _id: { $ne: id },
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const parseDate = (value) => {
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        return null;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        return null;
      }

      return date;
    };

    const startDate = validFrom !== undefined
      ? parseDate(validFrom)
      : coupon.validFrom;

    const endDate = validTo !== undefined
      ? parseDate(validTo)
      : coupon.validTo;

    if (!startDate || !endDate || endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon validity dates",
      });
    }

    const numericFields = {
      discount: discount ?? coupon.discount,
      minimumPrice: minimumPrice ?? coupon.minimumPrice,
      maximumPrice: maximumPrice ?? coupon.maximumPrice,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (
        value === "" ||
        typeof value === "boolean" ||
        !Number.isFinite(Number(value))
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid number`,
        });
      }
    }

    const discountValue = Number(numericFields.discount);
    const minPrice = Number(numericFields.minimumPrice);
    const maxPrice = Number(numericFields.maximumPrice);

    if (discountValue < 1 || discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 1 and 100",
      });
    }

    if (minPrice < 0 || maxPrice < minPrice) {
      return res.status(400).json({
        success: false,
        message: "Invalid minimum or maximum price",
      });
    }

    const allowedStatuses = ["Active", "Inactive"];

    const updatedData = {
      couponCode: normalizedCode,
      validFrom: startDate,
      validTo: endDate,
      userType: userType ?? coupon.userType,
      spaceType: spaceType ?? coupon.spaceType,
      discount: discountValue,
      minimumPrice: minPrice,
      maximumPrice: maxPrice,
      packType: packType ?? coupon.packType,
      status: status ?? coupon.status,
    };

    if (!allowedStatuses.includes(updatedData.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon status",
      });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });

  } catch (error) {
    console.error("Update coupon error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};

// DELETE COUPON
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });

  } catch (error) {
    console.error("Delete coupon error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};
