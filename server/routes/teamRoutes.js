
import { Router } from "express";

import {
  createTeamMember,
  getCustomerTeam,
  getMyTeam,
  updateTeamMember,
  deactivateTeamMember,
} from "../controllers/teamController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const teamRouter = Router();

// All routes require authentication
teamRouter.use(verifyToken);

// Admin routes
teamRouter.post(
  "/",
  authorizeRoles("admin"),
  createTeamMember
);

teamRouter.get(
  "/customer/:customerId",
  authorizeRoles("admin"),
  getCustomerTeam
);

teamRouter.put(
  "/:id",
  authorizeRoles("admin"),
  updateTeamMember
);

teamRouter.patch(
  "/:id/deactivate",
  authorizeRoles("admin"),
  deactivateTeamMember
);

// Customer read-only route
teamRouter.get(
  "/my-team",
  authorizeRoles("customer"),
  getMyTeam
);

export default teamRouter;
