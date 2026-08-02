import ProviderManager from "../../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../../services/chat.client.js";

export async function chatAgent(state) {

    try {

        const {
            chatId,
            prompt,
            workspace,
        } = state;

        /*
        ----------------------------
        Step 1
        Save user message
        ----------------------------
        */

        await saveMessage(
            chatId,
            "user",
            prompt
        );

        /*
        ----------------------------
        Step 2
        Load conversation
        ----------------------------
        */

        const history =
            await getMessages(chatId);

        /*
        ----------------------------
        Step 3
        Get Provider
        ----------------------------
        */

        const {
            provider,
            model,
        } = ProviderManager.getProvider(
            workspace
        );

        /*
        ----------------------------
        Step 4
        Generate AI Response (Supporting Stream)
        ----------------------------
        */

        let answer = "";

        if (state.onToken) {

            const stream = provider.stream({

                model,

                messages: history,

            });

            for await (const chunk of stream) {

                answer += chunk;

                state.onToken(chunk);

            }

        } else {

            answer = await provider.generate({

                model,

                messages: history,

            });

        }

        /*
        ----------------------------
        Step 5
        Save assistant message
        ----------------------------
        */

        await saveMessage(

            chatId,

            "assistant",

            answer

        );

        /*
        ----------------------------
        Step 6
        Return updated state
        ----------------------------
        */

        return {

            ...state,

            response: answer,

        };

    }

    catch (error) {

        console.error(error);

        return {

            ...state,

            error: error.message,

        };

    }

}