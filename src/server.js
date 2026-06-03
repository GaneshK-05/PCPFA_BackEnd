import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import connectDB from "./utils/db.js";
import mongoose from "mongoose";
import app from "./app.js";
import { syncData } from "./services/syncService.js";

const PORT = process.env.PORT || 3330;
const BASE_URL = process.env.BASE_URL || "https://t4e-testserver.onrender.com/api";

process.env.BASE_URL = BASE_URL;
process.env.STUDENT_ID = process.env.STUDENT_ID || "E0323029";
process.env.PASSWORD = process.env.PASSWORD || "626448";
process.env.SET_NAME = process.env.SET_NAME || "setB";

let dataset = [];


const loadData = async () => {
  try {
    console.log("Starting data fetch and sync process...");

    console.log("Authenticating with external API...");
    const response = await axios.post(`${BASE_URL}/public/token`, {
      studentId: process.env.STUDENT_ID,
      password: process.env.PASSWORD,
      set: process.env.SET_NAME,
    });

    const token = response.data.token;
    const dataUrl = response.data.dataUrl;

    if (!token || !dataUrl) {
      throw new Error("Authentication failed: token or dataUrl missing");
    }

    console.log(" Authentication successful. Fetching private dataset...");

    // Step 2: Fetch private dataset using token
    const dataResponse = await axios.get(`${BASE_URL}${dataUrl}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dataset = dataResponse.data.data || dataResponse.data;

    console.log("Dataset fetched successfully from private API");
    // Step 3: Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB Atlas");

    // Step 4: Sync data to MongoDB (validate, sanitize, and store)
    console.log("Syncing data to MongoDB...");
    await syncData(dataset);
    console.log("Data sync completed successfully");

    // Step 5: Start server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n  ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("HTTP server closed.");

        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
          process.exit(0);
        } catch (err) {
          console.error("Error during shutdown:", err.message);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Promise Rejection:", reason);
      shutdown("unhandledRejection");
    });
  } catch (err) {
    console.error("Error during data load:", err.message);
    if (err.response) {
      console.error("API Response:", err.response.data);
    }
    process.exit(1);
  }
};

app.get("/fitness", (req, res) => {
  res.json(dataset);
});

loadData();
