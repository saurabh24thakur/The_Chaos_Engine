import { Router } from "express";

import { executeChat, chatStream, getModels } from "../controller/orchestrator.controller.js";

const router = Router();

router.post("/chat", executeChat);
router.post("/chat/stream", chatStream);
router.get("/models", getModels);

export default router;