import express from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all project routes
router.use(authMiddleware);

router
  .route("/")
  .get(getProjects)
  .post(authorize(["admin", "manager"]), createProject);

router
  .route("/:id")
  .get(getProject)
  .put(authorize(["admin", "manager"]), updateProject)
  .patch(authorize(["admin", "manager"]), updateProject)
  .delete(authorize(["admin"]), deleteProject);

export default router;
