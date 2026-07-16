import express from "express";
import { executeChat } from "../controller/orchestrator.controller.js";

const router = express.Router();

router.route("/chat")
    .get(executeChat)
    .post(executeChat);

export default router;