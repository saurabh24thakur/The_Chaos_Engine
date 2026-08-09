import { Router } from "express";

import { executeChat,chatStream } from "../controller/orchestrator.controller.js";

const router = Router();

router.post("/chat", executeChat);
router.post("/chat/stream", chatStream);



export default router;