import ProviderManager from "../provider/provider.manager.js";
import { getMessages, saveMessage } from "../services/chat.client.js";

export async function chatNode(state, config) {
    try {
        const {
            chatId,
            prompt,
            workspace,
        } = state;

        if (!chatId) {
            throw new Error("chatId is required.");
        }

        if (!prompt) {
            throw new Error("prompt is required.");
        }

        // Save user message to database
        await saveMessage(chatId, "user", prompt);

        // Load conversation history
        const history = await getMessages(chatId);
        const conversation =
            Array.isArray(history) && history.length > 0
                ? history
                : [{
                    role: "user",
                    content: prompt,
                }];

        const { provider, model } =
            await ProviderManager.getProvider({
                workspace,
                provider: state.provider,
                model: state.model,
                apiKey: state.apiKey,
            });

        let answer = "";
        const writer = config?.writer;

        if (writer) {
            const stream = provider.stream({
                model,
                messages: conversation,
            });

            for await (const chunk of stream) {
                answer += chunk;
                writer({
                    type: "token",
                    content: chunk,
                });
            }
        } else {
            answer = await provider.generate({
                model,
                messages: conversation,
            });
        }

        // Save assistant response to database
        await saveMessage(chatId, "assistant", answer);

        const {
            apiKey,
            provider: providerName,
            model: selectedModel,
            ...safeState
        } = state;

        return {
            ...safeState,
            response: answer
        };
    } catch (error) {
        console.error("Chat Agent Error:", error);
        const {
            apiKey,
            provider,
            model,
            ...safeState
        } = state;

        return {
            ...safeState,
            error: error.message,
        };
    }
}
