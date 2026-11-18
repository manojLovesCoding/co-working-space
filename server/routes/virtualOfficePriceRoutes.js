import { Router } from "express";

import {
  getVirtualOfficePrices,
  createVirtualOfficePrice,
  updateVirtualOfficePrice,
  toggleVirtualOfficePriceStatus,
  getPublicVirtualOfficePrices,
} from "../controllers/virtualOfficePriceController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const virtualOfficePriceRouter = Router();

/*
 * PUBLIC
 * Customer/Homepage
 *
 * GET /api/virtual-office-price/public
 */
virtualOfficePriceRouter.get("/public", getPublicVirtualOfficePrices);

/*
 * ADMIN
 */

virtualOfficePriceRouter.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  getVirtualOfficePrices,
);

virtualOfficePriceRouter.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  createVirtualOfficePrice,
);

virtualOfficePriceRouter.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  updateVirtualOfficePrice,
);

virtualOfficePriceRouter.patch(
  "/:id/toggle-status",
  verifyToken,
  authorizeRoles("admin"),
  toggleVirtualOfficePriceStatus,
);

export default virtualOfficePriceRouter;
