import { Router } from "express";

import {
  login,
  createCustomer,
  getUsers,
  deactivateCustomer,
  updateCustomerPassword,
} from "../controllers/authController.js";

import {
  sendRegistrationOTPController,
  verifyRegistrationOTP,
} from "../controllers/registrationController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const authRouter = Router();

// Public routes
authRouter.post("/send-registration-otp", sendRegistrationOTPController);

authRouter.post("/verify-registration-otp", verifyRegistrationOTP);

authRouter.post("/login", login);

// Admin-only routes
authRouter.post(
  "/create-customer",
  verifyToken,
  authorizeRoles("admin"),
  createCustomer,
);

authRouter.get("/users", verifyToken, authorizeRoles("admin"), getUsers);

authRouter.patch(
  "/customer/:id/deactivate",
  verifyToken,
  authorizeRoles("admin"),
  deactivateCustomer,
);

// Admin-only: Update customer password
authRouter.patch(
  "/customer/:id/password",
  verifyToken,
  authorizeRoles("admin"),
  updateCustomerPassword,
);

export default authRouter;
