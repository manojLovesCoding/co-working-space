import mongoose from "mongoose";
import TeamMember from "../models/TeamMember.js";
import User from "../models/User.js";

// Validate customer account
const findCustomer = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return null;
  }

  return User.findOne({
    _id: customerId,
    role: "customer",
    isActive: true,
  });
};

// CREATE TEAM MEMBER - ADMIN ONLY
export const createTeamMember = async (req, res) => {
  try {
    const { customerId, name, email, phone, designation } = req.body;

    if (!customerId || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer, name, email and phone are required.",
      });
    }

    const customer = await findCustomer(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    const teamMember = await TeamMember.create({
      customer: customer._id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      designation: designation?.trim() || "",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Team member added successfully.",
      teamMember,
    });
  } catch (error) {
    console.error("Create team member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add team member.",
    });
  }
};

// GET TEAM MEMBERS FOR A CUSTOMER - ADMIN ONLY
export const getCustomerTeam = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await findCustomer(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    const teamMembers = await TeamMember.find({
      customer: customerId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
      },
      count: teamMembers.length,
      teamMembers,
    });
  } catch (error) {
    console.error("Get customer team error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch team members.",
    });
  }
};

// GET LOGGED-IN CUSTOMER'S TEAM - CUSTOMER READ ONLY
export const getMyTeam = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({
      customer: req.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: teamMembers.length,
      teamMembers,
    });
  } catch (error) {
    console.error("Get my team error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your team members.",
    });
  }
};

// UPDATE TEAM MEMBER - ADMIN ONLY
export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, designation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team member ID.",
      });
    }

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required.",
      });
    }

    const teamMember = await TeamMember.findOneAndUpdate(
      { _id: id, isActive: true },
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        designation: designation?.trim() || "",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Active team member not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team member updated successfully.",
      teamMember,
    });
  } catch (error) {
    console.error("Update team member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update team member.",
    });
  }
};

// DEACTIVATE TEAM MEMBER - ADMIN ONLY
export const deactivateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team member ID.",
      });
    }

    const teamMember = await TeamMember.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true },
    );

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Active team member not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team member deactivated successfully.",
      teamMember,
    });
  } catch (error) {
    console.error("Deactivate team member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate team member.",
    });
  }
};
