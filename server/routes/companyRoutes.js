import { Router } from "express";

import {
  getCompanyProfile,
  saveCompanyProfile,
} from "../controllers/companyController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const companyRouter = Router();

/*
 * Get company profile
 *
 * GET /api/company
 */
companyRouter.get(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  getCompanyProfile
);

/*
 * Create / update company profile
 *
 * PUT /api/company
 *
 * FormData field for logo:
 * "logo"
 */
companyRouter.put(
  "/",
  verifyToken,
  authorizeRoles("customer"),
  upload.single("logo"),
  saveCompanyProfile
);

export default companyRouter;