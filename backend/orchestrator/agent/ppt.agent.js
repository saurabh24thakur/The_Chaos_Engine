import ProviderManager from "../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../services/chat.client.js";

export async function pptAgent(state, config) {

    try {

        const {
            chatId,
            prompt,
            workspace,
        } = state;

        await saveMessage(chatId, "user", prompt);

        const history =
            await getMessages(chatId);

        const conversation =
            Array.isArray(history) && history.length > 0
                ? history
                : [{
                    role: "user",
                    content: prompt,
                }];

        const {
            provider,
            model,
        } = await ProviderManager.getProvider({
            workspace,
            provider: state.provider,
            model: state.model,
            apiKey: state.apiKey,
        });

        const messages = [
            {
                role: "system",
                content:
                    `You are a professional presentation creator.

Create a clear PowerPoint presentation structure from the user's request.

Return the presentation in this format:

TITLE:
<presentation title>

SLIDE 1:
Title: <title>
Content:
- point
- point
- point

SLIDE 2:
Title: <title>
Content:
- point
- point
- point

Continue for all required slides.

Keep the content concise, professional and presentation-ready.`
            },
            ...conversation,
        ];

        let answer = "";

        if (config?.writer) {

            const stream = provider.stream({
                model,
                messages,
            });

            for await (const chunk of stream) {

                answer += chunk;

                config.writer({
                    type: "token",
                    content: chunk,
                });

            }

        } else {

            answer = await provider.generate({
                model,
                messages,
            });

        }

        await saveMessage(chatId, "assistant", answer);

        const {
            apiKey,
            provider: providerName,
            model: selectedModel,
            ...safeState
        } = state;

        return {
            ...safeState,
            response: answer,
        };

    } catch (error) {

        console.error(
            "PPT Agent Error:",
            error
        );

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
