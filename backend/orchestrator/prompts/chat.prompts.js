import { Router } from "express";
import { chat as executeChat } from "../controller/orchestrator.controller.js";

const router = Router();

router.post("/chat", executeChat);

export default router;