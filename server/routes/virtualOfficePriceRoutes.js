import { Router } from "express";

import {
  getVirtualOfficePrices,
  createVirtualOfficePrice,
  updateVirtualOfficePrice,
  toggleVirtualOfficePriceStatus,
  getPublicVirtualOfficePrices,
  createVirtualOfficeOrder,
  verifyVirtualOfficePayment,
  getMyVirtualOfficePurchases,
} from "../controllers/virtualOfficePriceController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const virtualOfficePriceRouter = Router();

/* PUBLIC - CUSTOMER HOMEPAGE */

virtualOfficePriceRouter.get("/public", getPublicVirtualOfficePrices);

/* CUSTOMER - VIRTUAL OFFICE PURCHASE */

virtualOfficePriceRouter.post(
  "/create-order",
  verifyToken,
  authorizeRoles("customer"),
  createVirtualOfficeOrder,
);

virtualOfficePriceRouter.post(
  "/verify-payment",
  verifyToken,
  authorizeRoles("customer"),
  verifyVirtualOfficePayment,
);

/* CUSTOMER - PURCHASE HISTORY */

virtualOfficePriceRouter.get(
  "/my-purchases",
  verifyToken,
  authorizeRoles("customer"),
  getMyVirtualOfficePurchases,
);

/* ADMIN - PRICE MANAGEMENT */

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
