
import { Router } from "express";

import {
  getCompanyProfile,
  saveCompanyProfile,
  getAllCompanyProfiles,
} from "../controllers/companyController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const companyRouter = Router();

// ==========================================
// ADMIN: GET ALL COMPANY PROFILES
// GET /api/company/admin/all
// ==========================================
companyRouter.get(
  "/admin/all",
  verifyToken,
  authorizeRoles("admin"),
  getAllCompanyProfiles
);

// ==========================================
// CUSTOMER: GET OWN COMPANY PROFILE
// GET /api/company
// ==========================================
companyRouter.get(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  getCompanyProfile
);

// ==========================================
// CUSTOMER: CREATE / UPDATE COMPANY PROFILE
// PUT /api/company
// ==========================================
companyRouter.put(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  upload.single("logo"),
  saveCompanyProfile
);

export default companyRouter;
