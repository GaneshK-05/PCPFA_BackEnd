import express from "express";
import {
  getIssueAnalytics,
  getProjectAnalytics,
  getDeveloperAnalytics,
} from "../controllers/analyticsController.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize(["admin", "manager"]));

router.get("/issues", getIssueAnalytics);
router.get("/projects", getProjectAnalytics);
router.get("/developers", getDeveloperAnalytics);

export default router;
