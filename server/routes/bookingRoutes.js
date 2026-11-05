import { Router } from "express";

import {
  checkWorkspaceAvailability,
  validateCoupon,
  createRazorpayOrder,
  addWorkspaceBooking,
  getMyReservations,
  getAllReservations,
} from "../controllers/bookingController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const bookingRouter = Router();

// Check selected workspace availability
bookingRouter.post(
  "/check_workspace_availability",
  verifyToken,
  authorizeRoles("customer"),
  checkWorkspaceAvailability,
);

// Validate a coupon and preview the discount
bookingRouter.post(
  "/validate_coupon",
  verifyToken,
  authorizeRoles("customer"),
  validateCoupon,
);

// Create Razorpay order
bookingRouter.post(
  "/create_razorpay_order",
  verifyToken,
  authorizeRoles("customer"),
  createRazorpayOrder,
);

// Verify payment and confirm booking
bookingRouter.post(
  "/add_workspace_booking",
  verifyToken,
  authorizeRoles("customer"),
  addWorkspaceBooking,
);

bookingRouter.get(
  "/my_reservations",
  verifyToken,
  authorizeRoles("customer"),
  getMyReservations,
);

bookingRouter.get(
  "/all_reservations",
  verifyToken,
  authorizeRoles("admin"),
  getAllReservations,
);

export default bookingRouter;
