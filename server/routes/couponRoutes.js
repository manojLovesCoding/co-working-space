import { Router } from "express";

import {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const couponRouter = Router();

// All routes require admin authentication
couponRouter.use(verifyToken, authorizeRoles("admin"));

// CREATE
couponRouter.post("/", createCoupon);

// GET ALL
couponRouter.get("/", getCoupons);

// UPDATE
couponRouter.put("/:id", updateCoupon);

// DELETE
couponRouter.delete("/:id", deleteCoupon);

export default couponRouter;
