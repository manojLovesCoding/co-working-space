import { Router } from "express";

import {
  checkWorkspaceAvailability,
  createRazorpayOrder,
  addWorkspaceBooking,
  getMyReservations,
} from "../controllers/bookingController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const bookingRouter = Router();

// Check selected workspace availability
bookingRouter.post(
  "/check_workspace_availability",
  verifyToken,
  authorizeRoles("customer"),
  checkWorkspaceAvailability
);

// Create Razorpay order
bookingRouter.post(
  "/create_razorpay_order",
  verifyToken,
  authorizeRoles("customer"),
  createRazorpayOrder
);

// Verify payment and confirm booking
bookingRouter.post(
  "/add_workspace_booking",
  verifyToken,
  authorizeRoles("customer"),
  addWorkspaceBooking
);

bookingRouter.get(
  "/my_reservations",
  verifyToken,
  authorizeRoles("customer"),
  getMyReservations
);

export default bookingRouter;