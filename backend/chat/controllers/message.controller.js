import * as messageService from "../services/message.services.js";

export const createMessage = async (req, res) => {

    try {

        const {
            role,
            content,
            artifact = null,
        } = req.body;

        const message = await messageService.createMessage(

            req.params.chatId,

            role,

            content,

            artifact

        );

        res.status(201).json(message);

    } catch (err) {

        res.status(500).json({
            message: err.message,
        });

    }

};

export const getMessages = async (req, res) => {

    try {

        const messages = await messageService.getMessages(

            req.params.chatId

        );

        res.json(messages);

    } catch (err) {

        res.status(500).json({
            message: err.message,
        });

    }

};
