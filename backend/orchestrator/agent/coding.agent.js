import ProviderManager from "../provider/provider.manager.js";

import chatService from "../services/chat.service.js";


export async function codingAgent(state, config) {

    try {

        const {
            chatId,
            prompt,
            workspace,
        } = state;


        await chatService.saveMessage(
            chatId,
            {
                role: "user",
                content: prompt,
            }
        );


        const history =
            await chatService.getMessages(chatId);


        const {
            provider,
            model,
        } = ProviderManager.getProvider(
            workspace
        );


        const messages = [

            {
                role: "system",
                content:
                    "You are an expert software engineer. " +
                    "Help the user solve programming problems, " +
                    "debug code, explain concepts, and write " +
                    "clean, production-quality code. " +
                    "When providing code, use appropriate code blocks."
            },

            ...history,

        ];


        let answer = "";


        const writer =
            config?.writer;


        if (writer) {

            const stream =
                provider.stream({

                    model,
                    messages,

                });


            for await (
                const chunk of stream
            ) {

                answer += chunk;


                writer({

                    type: "token",

                    content: chunk,

                });

            }

        } else {

            answer =
                await provider.generate({

                    model,
                    messages,

                });

        }


        await chatService.saveMessage(
            chatId,
            {
                role: "assistant",
                content: answer,
            }
        );


        return {

            ...state,

            response: answer,

        };

    }

    catch (error) {

        console.error(
            "Coding Agent Error:",
            error
        );


        return {

            ...state,

            error: error.message,

        };

    }

}
