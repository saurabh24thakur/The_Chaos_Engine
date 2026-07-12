import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";


export const createChat = async (userId) => {

    return await Chat.create({

        userId

    });

};

export const getChats = async (userId) => {

    return await Chat.find({

        userId

    }).sort({

        updatedAt: -1

    });

};

export const getChat = async (id) => {

    return await Chat.findById(id);

};

export const renameChat = async (id, title) => {

    return await Chat.findByIdAndUpdate(

        id,

        { title },

        { new: true }

    );

};


export const deleteChat = async (id) => {

    await Message.deleteMany({
        chatId: id,
    });

    return await Chat.findByIdAndDelete(id);

};