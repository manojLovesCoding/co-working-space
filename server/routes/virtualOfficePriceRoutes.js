import { Router } from "express";

import {
  getVirtualOfficePrices,
  createVirtualOfficePrice,
  updateVirtualOfficePrice,
  toggleVirtualOfficePriceStatus,
} from "../controllers/virtualOfficePriceController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const virtualOfficePriceRouter = Router();

virtualOfficePriceRouter.use(verifyToken);
virtualOfficePriceRouter.use(authorizeRoles("admin"));

virtualOfficePriceRouter.get("/", getVirtualOfficePrices);

virtualOfficePriceRouter.post("/", createVirtualOfficePrice);

virtualOfficePriceRouter.put("/:id", updateVirtualOfficePrice);

virtualOfficePriceRouter.patch(
  "/:id/toggle-status",
  toggleVirtualOfficePriceStatus,
);

export default virtualOfficePriceRouter;
