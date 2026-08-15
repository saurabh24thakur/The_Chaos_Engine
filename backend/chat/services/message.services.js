import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

export const createMessage = async (
    chatId,
    role,
    content,
    artifact = null
) => {

    const message = await Message.create({
        chatId,
        role,
        content,
        artifact,
    });

    // Update chat timestamp
    await Chat.findByIdAndUpdate(chatId, {
        updatedAt: new Date(),
    });

    return message;
};

export const getMessages = async (chatId) => {

    const messages = await Message.find({
        chatId,
    })
        .select("role content artifact")
        .lean()
        .sort({
        createdAt: 1,
    });

    return messages.map((message) => ({
        role: message.role,
        content: message.content,
        artifact: message.artifact ?? null,
    }));

};

export const deleteMessages = async (chatId) => {

    return await Message.deleteMany({
        chatId,
    });

};
