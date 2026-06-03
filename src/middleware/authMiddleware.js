import jwt from "jsonwebtoken";

/**
 * Verify JWT token and attach user ID to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-env");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Check if user has required role
 */
export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Authorization error:", err);
      res.status(500).json({
        success: false,
        message: "Error checking authorization",
      });
    }
  };
};
