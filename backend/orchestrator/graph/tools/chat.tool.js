import ProviderManager from "../../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../../services/chat.client.js";


export async function chatTool(state, config) {

    try {

        const {
            chatId,
            prompt,
            workspace,
        } = state;


        
        //  Save user message

        await saveMessage(
            chatId,
            "user",
            prompt
        );


        //  Load conversation

        const history =
            await getMessages(chatId);

        const messages =
            Array.isArray(history) && history.length > 0
                ? history
                : [{
                    role: "user",
                    content: prompt,
                }];


       
        // Get provider
        

        const {
            provider,
            model,
        } = await ProviderManager.getProvider({
            workspace,
            provider: state.provider,
            model: state.model,
            apiKey: state.apiKey,
        });


        let answer = "";


       

        const writer = config?.writer;


        if (writer) {

            // Streaming response

            const stream =
                provider.stream({

                    model,

                    messages,

                });


            for await (
                const chunk of stream
            ) {

                // Build complete answer
                answer += chunk;
                console.log("TOKEN:", chunk);


                // Send token to LangGraph
                writer({

                    type: "token",

                    content: chunk,

                });

            }

        }


        // --------------------------------
        // 5. Normal response
        // --------------------------------

        else {

                answer =
                await provider.generate({

                    model,

                    messages,

                });

        }


        // --------------------------------
        // 6. Save complete assistant answer
        // --------------------------------

        await saveMessage(
            chatId,
            "assistant",
            answer
        );


        // --------------------------------
        // 7. Return graph state
        // --------------------------------

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

    }

    catch (error) {

        console.error(
            "Chat Agent Error:",
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
