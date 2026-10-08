import { Router } from "express";

import {
  getProfile,
  updateProfile,
} from "../controllers/profileController2.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const profileRouter2 = Router();

/*
 * Get logged-in user's profile
 *
 * GET /api/profile
 */
profileRouter2.get(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  getProfile,
);

/*
 * Update logged-in user's profile
 *
 * PUT /api/profile
 *
 * Image field name:
 * profilePic
 */
profileRouter2.put(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  upload.single("profilePic"),
  updateProfile,
);

export default profileRouter2;
