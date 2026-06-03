import express from "express";
import { handleSync } from "../controllers/syncController.js";

const router = express.Router();


router.post("/", handleSync);

export default router;
