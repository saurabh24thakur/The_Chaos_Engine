import axios from "axios";
import env from "../config/env.js";

class ChatService {

    async getMessages(chatId) {

        const response = await axios.get(
            `${env.CHAT_SERVICE_URL}/api/chat/${chatId}/messages`
        );

        return response.data.data;

    }

    async saveMessage(chatId, message) {

        await axios.post(

            `${env.CHAT_SERVICE_URL}/api/chat/${chatId}/messages`,

            message

        );

    }

}

export default new ChatService();