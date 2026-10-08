import { Router } from "express";

import {
  createSpace,
  getSpaces,
  getPublicSpaces,
  updateSpace,
} from "../controllers/spaceController.js";

import { verifyToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const spaceRouter = Router();

/*
 * PUBLIC
 * Customer/Homepage
 *
 * GET /api/space/public
 */
spaceRouter.get("/public", getPublicSpaces);


/*
 * ADMIN
 */

spaceRouter.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  upload.single("image"),
  createSpace
);

spaceRouter.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  getSpaces
);

spaceRouter.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  upload.single("image"),
  updateSpace
);

export default spaceRouter;