import express from "express";
import { register, login, getCurrentUser, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Authentication Routes
 */

// Register new user
router.post("/register", register);

// Login user
router.post("/login", login);

// Get current user (protected route)
router.get("/me", authMiddleware, getCurrentUser);

// Logout
router.post("/logout", authMiddleware, logout);

export default router;
