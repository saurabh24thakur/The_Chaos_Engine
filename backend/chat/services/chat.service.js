import Chat from "../models/chat.model.js";
import { deleteMessages } from "./message.services.js";

function buildConfig(chat) {
  if (!chat) {
    return null;
  }

  return {
    provider: chat.provider || "",
    model: chat.model || "",
  };
}

export const createChat = async (userId) => {
  return Chat.create({
    userId,
    title: "New Chat",
    provider: "",
    model: "",
  });
};

export const getChats = async (userId) => {
  return Chat.find({ userId }).sort({ updatedAt: -1 });
};

export const getChat = async (id) => {
  return Chat.findById(id);
};

export const renameChat = async (id, title) => {
  return Chat.findByIdAndUpdate(
    id,
    { title },
    { new: true }
  );
};

export const deleteChat = async (id) => {
  await deleteMessages(id);
  return Chat.findByIdAndDelete(id);
};

export const getChatConfig = async (chatId) => {
  const chat = await Chat.findById(chatId).select("provider model");

  if (!chat) {
    return null;
  }

  return buildConfig(chat);
};

export const updateChatConfig = async (chatId, config = {}) => {
  const provider = String(config.provider || "").trim().toLowerCase();
  const model = String(config.model || "").trim();

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      provider,
      model,
    },
    { new: true }
  ).select("provider model");

  return buildConfig(chat);
};

