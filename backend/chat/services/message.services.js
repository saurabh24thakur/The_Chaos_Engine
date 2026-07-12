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

    return await Message.find({
        chatId,
    }).sort({
        createdAt: 1,
    });

};

export const deleteMessages = async (chatId) => {

    return await Message.deleteMany({
        chatId,
    });

};