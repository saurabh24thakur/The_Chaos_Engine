import axios from "axios";
import env from "../config/env.js";

const chatClient = axios.create({
    baseURL: env.CHAT_SERVICE_URL,
    timeout: 10000,
});

export const getMessages = async (chatId) => {
    const { data } = await chatClient.get(`/messages/${chatId}`);
    return data;
};

export const saveMessage = async (chatId, role, content) => {
    const { data } = await chatClient.post(`/messages/${chatId}`, {
        role,
        content,
    });

    return data;
};

export default chatClient;