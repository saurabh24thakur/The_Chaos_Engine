import express from "express";

import * as messageController from "../controllers/message.controller.js";

const router = express.Router();

router.post("/:chatId", messageController.createMessage);

router.get("/:chatId", messageController.getMessages);

export default router;