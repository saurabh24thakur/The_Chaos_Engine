import express from "express";

import { chat, chatStream } from "../controller/orchestrator.controller.js";

const router = express.Router();

router.post("/chat", chat);
router.post("/chat/stream", chatStream);

export default router;