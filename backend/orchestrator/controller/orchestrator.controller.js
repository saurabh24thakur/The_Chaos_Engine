import GraphRegistry from "../graph/graph.registry.js";
import { getProviderCatalog } from "../config/model.js";
import { getChat } from "../services/chat.client.js";
import { getProviderApiKey } from "../services/auth.client.js";

export const executeChat = async (req, res) => {
    try {
        const {
            workspace,
            chatId,
            prompt,
            provider: bodyProvider,
            model: bodyModel,
            apiKey: bodyApiKey,
        } = req.body;

        let resolvedProvider = bodyProvider;
        let resolvedModel = bodyModel;
        let resolvedApiKey = bodyApiKey || req.headers["x-api-key"] || req.headers["X-API-Key"];
        let resolvedUserId = "";

        if (chatId) {
            const chat = await getChat(chatId);
            if (chat) {
                resolvedProvider = resolvedProvider || chat.provider;
                resolvedModel = resolvedModel || chat.model;
                resolvedUserId = chat.userId;
            }
        }

        if (!resolvedProvider) {
            return res.status(400).json({
                success: false,
                message: "No provider configured for this chat. Please select a model.",
            });
        }

        if (!resolvedModel) {
            return res.status(400).json({
                success: false,
                message: "No model configured for this chat. Please select a model.",
            });
        }

        if (!resolvedApiKey && resolvedUserId) {
            resolvedApiKey = await getProviderApiKey(resolvedUserId, resolvedProvider);
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                success: false,
                message: `API key is not configured for provider '${resolvedProvider}'. Go to Settings.`,
            });
        }

        const graph = GraphRegistry.getGraph(workspace);

        const result = await graph.invoke({
            workspace,
            chatId,
            prompt,
            provider: resolvedProvider,
            model: resolvedModel,
            apiKey: resolvedApiKey,
            userId: resolvedUserId,
        });

        res.json({
            success: true,
            response: result.response,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const chatStream = async (req, res) => {
    try {
        const {
            workspace,
            chatId,
            prompt,
            provider: bodyProvider,
            model: bodyModel,
            apiKey: bodyApiKey,
        } = req.body;

        let resolvedProvider = bodyProvider;
        let resolvedModel = bodyModel;
        let resolvedApiKey = bodyApiKey || req.headers["x-api-key"] || req.headers["X-API-Key"];
        let resolvedUserId = "";

        if (chatId) {
            const chat = await getChat(chatId);
            if (chat) {
                resolvedProvider = resolvedProvider || chat.provider;
                resolvedModel = resolvedModel || chat.model;
                resolvedUserId = chat.userId;
            }
        }

        if (!resolvedProvider) {
            throw new Error("No provider configured for this chat. Please select a model.");
        }

        if (!resolvedModel) {
            throw new Error("No model configured for this chat. Please select a model.");
        }

        if (!resolvedApiKey && resolvedUserId) {
            resolvedApiKey = await getProviderApiKey(resolvedUserId, resolvedProvider);
        }

        if (!resolvedApiKey) {
            throw new Error(`API key is not configured for provider '${resolvedProvider}'. Go to Settings.`);
        }

        const graph = GraphRegistry.getGraph(workspace);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const stream = await graph.stream(
            {
                workspace,
                chatId,
                prompt,
                provider: resolvedProvider,
                model: resolvedModel,
                apiKey: resolvedApiKey,
                userId: resolvedUserId,
            },
            {
                streamMode: "custom",
            }
        );

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);

            if (typeof res.flush === "function") {
                res.flush();
            }
        }

        res.write(
            `data: ${JSON.stringify({
                type: "done",
            })}\n\n`
        );

        res.end();
    } catch (error) {
        console.error("Streaming error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

        res.write(
            `data: ${JSON.stringify({
                type: "error",
                message: error.message,
            })}\n\n`
        );

        res.end();
    }
};

export const getModels = async (req, res) => {
    try {
        const catalog = getProviderCatalog();
        res.json(catalog);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
