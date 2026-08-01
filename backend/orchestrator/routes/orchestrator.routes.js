import { Router } from "express";

import { executeChat } from "../controller/orchestrator.controller.js";

const router = Router();

router.post("/chat", executeChat);

export default router;