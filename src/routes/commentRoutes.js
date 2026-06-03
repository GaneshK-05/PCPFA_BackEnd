import express from "express";
import { getComments, addComment } from "../controllers/commentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

// Allow merging params so we can access :issueId from parent router if needed
// However, since we define routes fully here or mount them via issueId, we just use standard router.
const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

// These routes will be mounted in app.js at /api/issues/:issueId/comments
router.route("/")
  .get(getComments)
  .post(addComment);

export default router;
