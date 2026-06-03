import express from "express";

import authRoutes from "./routes/authRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import commentRoutesStandalone from "./routes/commentRoutesStandalone.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Issue Tracker Sync API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running at 3330",
    timestamp: new Date().toISOString(),
  });
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).send();
});

// Authentication routes
app.use("/auth", authRoutes);

// Sync routes
app.use("/sync", syncRoutes);

// Application API routes
app.use("/api/projects", projectRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/issues/:issueId/comments", commentRoutes);
app.use("/api/comments", commentRoutesStandalone);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/issues/:issueId/logs", logRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
