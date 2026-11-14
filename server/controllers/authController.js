import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ==========================================
// PUBLIC CUSTOMER REGISTRATION
// ==========================================
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always creates a customer.
    // Never accept role from the request body.
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "customer",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Registration Successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address or phone number is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// LOGIN
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email?.trim() || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required",
      });
    }

    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Contact the administrator.",
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid role",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN: CREATE CUSTOMER
// ==========================================
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "customer",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        isActive: customer.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address or phone number is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN: GET ALL USERS
// ==========================================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN: DEACTIVATE CUSTOMER
// ==========================================
export const deactivateCustomer = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.isActive) {
      return res.status(400).json({
        success: false,
        message: "Customer account is already inactive",
      });
    }

    customer.isActive = false;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer account deactivated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
