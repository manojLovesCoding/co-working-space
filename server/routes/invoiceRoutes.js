import { Router } from "express";

import {
  getMyInvoices,
  getMyInvoiceByBooking,
  getAllInvoices,
  getInvoiceById,
} from "../controllers/invoiceController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const invoiceRouter = Router();

// Customer: own invoices only
invoiceRouter.get(
  "/my",
  verifyToken,
  authorizeRoles("customer"),
  getMyInvoices,
);

invoiceRouter.get(
  "/booking/:bookingId",
  verifyToken,
  authorizeRoles("customer"),
  getMyInvoiceByBooking,
);

// Admin: every invoice
invoiceRouter.get("/all", verifyToken, authorizeRoles("admin"), getAllInvoices);

invoiceRouter.get(
  "/admin/:id",
  verifyToken,
  authorizeRoles("admin"),
  getInvoiceById,
);

export default invoiceRouter;
