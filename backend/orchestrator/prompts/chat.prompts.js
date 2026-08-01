import { Router } from "express";
import { executeChat } from "../controllers/orchestrator.controller.js";

const router = Router();

router.post("/chat", executeChat);

export default router;