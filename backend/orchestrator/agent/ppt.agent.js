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

        const {
            provider,
            model,
        } = ProviderManager.getProvider(workspace);

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
            ...history,
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

        return {
            ...state,
            response: answer,
        };

    } catch (error) {

        console.error(
            "PPT Agent Error:",
            error
        );

        return {
            ...state,
            error: error.message,
        };

    }

}
