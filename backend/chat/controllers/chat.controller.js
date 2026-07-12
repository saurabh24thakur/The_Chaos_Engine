import * as chatService from "../services/chat.service.js";

export const createChat = async (req, res) => {

    try {

        const { userId } = req.body;

        const chat = await chatService.createChat(userId);

        res.status(201).json(chat);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

export const getChats = async (req, res) => {

    try {

        const { userId } = req.params;

        const chats = await chatService.getChats(userId);

        res.json(chats);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

export const getChat = async (req, res) => {

    try {

        const chat = await chatService.getChat(req.params.id);

        res.json(chat);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

export const renameChat = async (req, res) => {

    try {

        const chat = await chatService.renameChat(

            req.params.id,

            req.body.title

        );

        res.json(chat);

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};

export const deleteChat = async (req, res) => {

    try {

        await chatService.deleteChat(req.params.id);

        res.json({

            message: "Deleted"

        });

    } catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};