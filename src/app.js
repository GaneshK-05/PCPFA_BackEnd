import express from "express";

import syncRoutes from "./routes/syncRoutes.js";

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

app.use("/sync", syncRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
