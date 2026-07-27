import axios from "axios";
import env from "../config/env.js";

class ChatService {

    async getMessages(chatId) {

        try {

            const response = await axios.get(
                `${env.CHAT_SERVICE_URL}/messages/${chatId}`
            );

            return response.data;

        } catch (error) {

            if (error.response?.status === 404) {

                return [];

            }

            throw error;
        }
    }

    async saveMessage(chatId, message) {

        return await axios.post(
            `${env.CHAT_SERVICE_URL}/messages/${chatId}`,
            message
        );

    }

}

export default new ChatService();