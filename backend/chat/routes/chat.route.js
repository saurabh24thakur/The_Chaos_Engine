import express from "express";

import * as chatController from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", chatController.createChat);

router.get("/:userId", chatController.getChats);

router.get("/single/:id", chatController.getChat);

router.get("/config/:chatId", chatController.getChatConfig);

router.put("/config/:chatId", chatController.updateChatConfig);

router.patch("/:id", chatController.renameChat);

router.delete("/:id", chatController.deleteChat);

export default router;
