import Chat from "../models/chat.model.js";
import { deleteMessages } from "./message.services.js";
import mongoose from "mongoose";

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
    return await Chat.create({
        userId,
        title: "New Chat",
        provider: "",
        model: "",
    });
};

export const getChats = async (userId) => {
    return await Chat.find({ userId }).sort({ updatedAt: -1 });
};

export const getChat = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }
    return await Chat.findById(id);
};

export const renameChat = async (id, title) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid Chat ID");
    }
    if (!title || typeof title !== "string" || !title.trim()) {
        throw new Error("Title is required");
    }
    const trimmed = title.trim();
    if (trimmed.length > 100) {
        throw new Error("Title must not exceed 100 characters");
    }
    return await Chat.findByIdAndUpdate(
        id,
        { title: trimmed },
        { new: true }
    );
};

export const deleteChat = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }
    await deleteMessages(id);
    return await Chat.findByIdAndDelete(id);
};

export const getChatConfig = async (chatId) => {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return null;
    }
    const chat = await Chat.findById(chatId).select("provider model");
    if (!chat) {
        return null;
    }
    return buildConfig(chat);
};

export const updateChatConfig = async (chatId, config = {}) => {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return null;
    }
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
