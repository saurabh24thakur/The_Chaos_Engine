import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

export const createMessage = async (
    chatId,
    role,
    content
) => {

    const message = await Message.create({
        chatId,
        role,
        content,
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
        .select("role content")
        .lean()
        .sort({
        createdAt: 1,
    });

    return messages.map((message) => ({
        role: message.role,
        content: message.content,
    }));

};

export const deleteMessages = async (chatId) => {

    return await Message.deleteMany({
        chatId,
    });

};
