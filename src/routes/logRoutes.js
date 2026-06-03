import express from "express";
import { getLogs } from "../controllers/logController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.route("/")
  .get(getLogs);

export default router;
