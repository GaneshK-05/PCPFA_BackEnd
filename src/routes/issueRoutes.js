import express from "express";
import {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  updateIssueStatus,
  updateIssuePriority,
  assignIssue,
} from "../controllers/issueController.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getIssues)
  .post(authorize(["admin", "manager", "tester"]), createIssue);

router.route("/:id")
  .get(getIssue)
  .put(authorize(["admin", "manager", "developer"]), updateIssue)
  .patch(authorize(["admin", "manager", "developer"]), updateIssue)
  .delete(authorize(["admin"]), deleteIssue);

router.route("/:id/assign")
  .patch(authorize(["admin", "manager"]), assignIssue);

router.route("/:id/status")
  .patch(authorize(["admin", "manager", "developer"]), updateIssueStatus);

router.route("/:id/priority")
  .patch(authorize(["admin", "manager"]), updateIssuePriority);

export default router;
