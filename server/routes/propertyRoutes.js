import { Router } from "express";
import {
  addProperty,
  deleteProperty,
  getProperties,
  getHomeProperties,
  updateProperty,
  removeTenant,
  assignTenant,
  getAssignedTenants,
  getTenantProperty,
  getPendingRent,
} from "../controllers/propertyController.js";
import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const propertyRouter = Router();

propertyRouter.get("/home", getHomeProperties);

propertyRouter.post(
  "/add",
  verifyToken,
  authorizeRoles("admin", "customer"),
  upload.single("image"),
  addProperty
);

propertyRouter.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "customer"),
  getProperties
);

propertyRouter.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "customer"),
  deleteProperty
);


propertyRouter.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "customer"),
  upload.single("image"),
  updateProperty
);

propertyRouter.put(
  "/:id/assign-tenant",
  verifyToken,
  authorizeRoles("admin", "customer"),
  assignTenant
);

propertyRouter.put(
  "/:id/remove-tenant",
  verifyToken,
  authorizeRoles("admin", "customer"),
  removeTenant
);

propertyRouter.get(
  "/assigned-tenants",
  verifyToken,
  authorizeRoles("admin", "customer"),
  getAssignedTenants
);

propertyRouter.get(
  "/tenant-property",
  verifyToken,
  authorizeRoles("tenant"),
  getTenantProperty
);

propertyRouter.get(
  "/pending-rent",
  verifyToken,
  authorizeRoles("tenant"),
  getPendingRent
);



export default propertyRouter;