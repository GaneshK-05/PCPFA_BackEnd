import express from "express";
import {
  getAllComments,
  getCommentById,
  createCommentStandalone,
  deleteCommentStandalone,
} from "../controllers/commentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getAllComments)
  .post(createCommentStandalone);

router.route("/:id")
  .get(getCommentById)
  .delete(deleteCommentStandalone);

export default router;
