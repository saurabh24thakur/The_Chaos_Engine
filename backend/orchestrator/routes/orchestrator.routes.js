import { Router } from "express";

import {
    executeChat,
    chatStream,
    getModels,
    downloadPresentation,
} from "../controller/orchestrator.controller.js";

const router = Router();

router.post("/chat", executeChat);
router.post("/chat/stream", chatStream);
router.get("/models", getModels);
router.get("/ppt/download/:fileName", downloadPresentation);

export default router;
