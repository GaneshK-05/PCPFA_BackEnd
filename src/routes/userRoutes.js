import express from "express";
import { getUsers, getUserById } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getUsers);

router.route("/:id")
  .get(getUserById);

export default router;
