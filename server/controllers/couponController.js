import mongoose from "mongoose";
import Coupon from "../models/couponModel.js";

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

const normalizeEmails = (emails) => {
  if (!Array.isArray(emails)) return [];

  return [
    ...new Set(
      emails
        .map((email) => String(email).trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateSelectedEmails = (userType, emails) => {
  if (userType !== "Selected Email Addresses") {
    return { emails: [], error: null };
  }

  const normalized = normalizeEmails(emails);

  if (normalized.length === 0) {
    return {
      emails: [],
      error: "Please provide at least one email address",
    };
  }

  const invalidEmails = normalized.filter((email) => !isValidEmail(email));

  if (invalidEmails.length > 0) {
    return {
      emails: [],
      error: `Invalid email addresses: ${invalidEmails.join(", ")}`,
    };
  }

  return { emails: normalized, error: null };
};

const validateNumericFields = ({ discount, minimumPrice, maximumPrice }) => {
  for (const [field, value] of Object.entries({
    discount,
    minimumPrice,
    maximumPrice,
  })) {
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      typeof value === "boolean" ||
      !Number.isFinite(Number(value))
    ) {
      return `${field} must be a valid number`;
    }
  }

  if (Number(discount) < 1 || Number(discount) > 100) {
    return "Discount must be between 1 and 100";
  }

  if (Number(minimumPrice) < 0 || Number(maximumPrice) < 0) {
    return "Prices cannot be negative";
  }

  if (Number(maximumPrice) < Number(minimumPrice)) {
    return "Maximum price must be greater than or equal to minimum price";
  }

  return null;
};

// POST /api/coupon
export const createCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      validFrom,
      validTo,
      userType,
      selectedEmails,
      spaceType,
      discount,
      minimumPrice,
      maximumPrice,
      packType,
    } = req.body;

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

    const normalizedCode = String(couponCode).trim().toUpperCase();

    if (!/^[A-Z0-9_-]{1,30}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code format",
      });
    }

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

    const numericError = validateNumericFields({
      discount,
      minimumPrice,
      maximumPrice,
    });

    if (numericError) {
      return res.status(400).json({
        success: false,
        message: numericError,
      });
    }

    const { emails, error: emailError } = validateSelectedEmails(
      userType,
      selectedEmails
    );

    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    const existingCoupon = await Coupon.findOne({
      couponCode: normalizedCode,
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      couponCode: normalizedCode,
      validFrom: startDate,
      validTo: endDate,
      userType,
      selectedEmails: emails,
      spaceType,
      discount: Number(discount),
      minimumPrice: Number(minimumPrice),
      maximumPrice: Number(maximumPrice),
      packType,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

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

// GET /api/coupon
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

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

// PUT /api/coupon/:id
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const {
      couponCode,
      validFrom,
      validTo,
      userType,
      selectedEmails,
      spaceType,
      discount,
      minimumPrice,
      maximumPrice,
      packType,
      status,
    } = req.body;

    const normalizedCode = String(
      couponCode ?? coupon.couponCode
    ).trim().toUpperCase();

    if (!/^[A-Z0-9_-]{1,30}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code format",
      });
    }

    const duplicate = await Coupon.findOne({
      couponCode: normalizedCode,
      _id: { $ne: id },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const startDate =
      validFrom !== undefined ? parseDate(validFrom) : coupon.validFrom;
    const endDate =
      validTo !== undefined ? parseDate(validTo) : coupon.validTo;

    if (!startDate || !endDate || endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon validity dates",
      });
    }

    const numericValues = {
      discount: discount ?? coupon.discount,
      minimumPrice: minimumPrice ?? coupon.minimumPrice,
      maximumPrice: maximumPrice ?? coupon.maximumPrice,
    };

    const numericError = validateNumericFields(numericValues);

    if (numericError) {
      return res.status(400).json({
        success: false,
        message: numericError,
      });
    }

    const effectiveUserType = userType ?? coupon.userType;
    const effectiveEmails =
      selectedEmails !== undefined ? selectedEmails : coupon.selectedEmails;

    const { emails, error: emailError } = validateSelectedEmails(
      effectiveUserType,
      effectiveEmails
    );

    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    const updatedStatus = status ?? coupon.status;

    if (!["Active", "Inactive"].includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon status",
      });
    }

    const updatedData = {
      couponCode: normalizedCode,
      validFrom: startDate,
      validTo: endDate,
      userType: effectiveUserType,
      selectedEmails: emails,
      spaceType: spaceType ?? coupon.spaceType,
      discount: Number(numericValues.discount),
      minimumPrice: Number(numericValues.minimumPrice),
      maximumPrice: Number(numericValues.maximumPrice),
      packType: packType ?? coupon.packType,
      status: updatedStatus,
    };

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

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

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};

// DELETE /api/coupon/:id
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

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

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};
