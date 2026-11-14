
import { Router } from "express";

import {
  register,
  login,
  createCustomer,
  getUsers,
  deactivateCustomer,
} from "../controllers/authController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const authRouter = Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);

// Admin-only routes
authRouter.post(
  "/create-customer",
  verifyToken,
  authorizeRoles("admin"),
  createCustomer
);

authRouter.get(
  "/users",
  verifyToken,
  authorizeRoles("admin"),
  getUsers
);

authRouter.patch(
  "/customer/:id/deactivate",
  verifyToken,
  authorizeRoles("admin"),
  deactivateCustomer
);

export default authRouter;
