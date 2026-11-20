import crypto from "crypto";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import PendingRegistration from "../models/PendingRegistration.js";
import { sendRegistrationOTP } from "../config/mailer.js";

// OTP configuration
const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// ==========================================
// SEND REGISTRATION OTP
// ==========================================
export const sendRegistrationOTPController = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Check whether email or phone is already registered
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    // Check pending registration by email
    let pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    // Check whether phone belongs to another pending registration
    const phoneRegistration = await PendingRegistration.findOne({
      phone: normalizedPhone,
      email: { $ne: normalizedEmail },
    });

    if (phoneRegistration) {
      return res.status(409).json({
        success: false,
        message: "Phone number is already being used for another registration",
      });
    }

    // Enforce OTP resend cooldown
    if (pendingRegistration) {
      const currentTime = Date.now();
      const lastSentTime = new Date(
        pendingRegistration.lastOtpSentAt,
      ).getTime();

      const elapsedSeconds = Math.floor((currentTime - lastSentTime) / 1000);

      if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
        const remainingSeconds = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          remainingSeconds,
        });
      }
    }

    // Generate a cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP and password before storing
    const otpHash = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update existing pending registration or create a new one
    if (pendingRegistration) {
      pendingRegistration.name = name.trim();
      pendingRegistration.phone = normalizedPhone;
      pendingRegistration.password = hashedPassword;
      pendingRegistration.otpHash = otpHash;
      pendingRegistration.expiresAt = expiresAt;
      pendingRegistration.attempts = 0;
      pendingRegistration.lastOtpSentAt = new Date();

      await pendingRegistration.save();
    } else {
      await PendingRegistration.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        otpHash,
        expiresAt,
        attempts: 0,
        lastOtpSentAt: new Date(),
      });
    }

    // Send OTP email
    try {
      await sendRegistrationOTP(normalizedEmail, otp, name.trim());
    } catch (emailError) {
      // Do not leave a pending registration if email delivery fails
      await PendingRegistration.deleteOne({
        email: normalizedEmail,
      });

      console.error("Registration OTP email failed:", emailError);

      return res.status(500).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification OTP sent successfully to your email",
      email: normalizedEmail,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Send registration OTP error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address or phone number is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// VERIFY REGISTRATION OTP
// ==========================================
export const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP",
      });
    }

    const pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message: "Registration session not found. Please register again.",
      });
    }

    // Check OTP expiration
    if (pendingRegistration.expiresAt.getTime() <= Date.now()) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check maximum verification attempts
    if (pendingRegistration.attempts >= MAX_OTP_ATTEMPTS) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(429).json({
        success: false,
        message: "Maximum OTP attempts exceeded. Please register again.",
      });
    }

    // Compare submitted OTP with stored hash
    const otpMatches = await bcrypt.compare(
      otp.trim(),
      pendingRegistration.otpHash,
    );

    if (!otpMatches) {
      pendingRegistration.attempts += 1;

      const remainingAttempts = MAX_OTP_ATTEMPTS - pendingRegistration.attempts;

      if (remainingAttempts <= 0) {
        await PendingRegistration.deleteOne({
          _id: pendingRegistration._id,
        });

        return res.status(429).json({
          success: false,
          message: "Maximum OTP attempts exceeded. Please register again.",
        });
      }

      await pendingRegistration.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again.",
        remainingAttempts,
      });
    }

    // Recheck email and phone before creating permanent account
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: pendingRegistration.phone }],
    });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    // Create permanent customer only after successful verification
    const newUser = await User.create({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      phone: pendingRegistration.phone,
      password: pendingRegistration.password,
      role: "customer",
      isActive: true,
    });

    // Delete temporary registration after successful account creation
    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    return res.status(201).json({
      success: true,
      message: "Email verified and registration completed successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Verify registration OTP error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address or phone number is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
