import axios from "axios";

import env from "../config/env.js";

function getBaseUrl() {
    if (!env.CHAT_SERVICE_URL) {
        throw new Error("CHAT_SERVICE_URL is not configured.");
    }

    return env.CHAT_SERVICE_URL.replace(/\/$/, "");
}

function normalizeMessage(role, content) {
    if (
        role &&
        typeof role === "object" &&
        !Array.isArray(role)
    ) {
        return {
            role: role.role,
            content: role.content,
            artifact: role.artifact ?? null,
        };
    }

    return {
        role,
        content,
        artifact: null,
    };
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .map((message) => normalizeMessage(message))
        .filter((message) => {
            return Boolean(
                message &&
                message.role &&
                message.content !== undefined &&
                message.content !== null
            );
        })
        .map((message) => ({
            role: String(message.role).trim(),
            content: typeof message.content === "string"
                ? message.content
                : String(message.content),
            artifact: message.artifact ?? null,
        }));
}

function buildErrorMessage(action, error) {
    const status = error.response?.status;
    const detail =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Unknown error";

    if (status) {
        return `${action} failed with status code ${status}: ${detail}`;
    }

    return `${action} failed: ${detail}`;
}

export async function getMessages(chatId) {
    if (!chatId) {
        throw new Error("chatId is required.");
    }

    try {
        const response = await axios.get(
            `${getBaseUrl()}/messages/${chatId}`
        );

        if (Array.isArray(response.data)) {
            return sanitizeMessages(response.data);
        }

        if (Array.isArray(response.data?.data)) {
            return sanitizeMessages(response.data.data);
        }

        return [];
    } catch (error) {
        if (error.response?.status === 404) {
            return [];
        }

        throw new Error(buildErrorMessage("Get messages", error));
    }
}

export async function getChat(chatId) {
    if (!chatId) {
        throw new Error("chatId is required.");
    }

    try {
        const response = await axios.get(
            `${getBaseUrl()}/chat/single/${chatId}`
        );
        return response.data;
    } catch (error) {
        throw new Error(buildErrorMessage("Get chat", error));
    }
}

export async function saveMessage(chatId, role, content, artifact = null) {
    if (!chatId) {
        throw new Error("chatId is required.");
    }

    const message = normalizeMessage(role, content);

    if (!message.role) {
        throw new Error("Message role is required.");
    }

    if (message.content === undefined || message.content === null) {
        throw new Error("Message content is required.");
    }

    try {
        const response = await axios.post(
            `${getBaseUrl()}/messages/${chatId}`,
            {
                ...message,
                artifact,
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(buildErrorMessage("Save message", error));
    }
}

const chatClient = {
    getMessages,
    saveMessage,
    getChat,
};

export default chatClient;
