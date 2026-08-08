import ProviderManager from "../../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../../services/chat.client.js";


export async function chatAgent(state, config) {

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


       
        // Get provider
        

        const {
            provider,
            model,
        } = ProviderManager.getProvider(
            workspace
        );


        let answer = "";


       

        const writer = config?.writer;


        if (writer) {

            // Streaming response

            const stream =
                provider.stream({

                    model,

                    messages: history,

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

                    messages: history,

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

        return {

            ...state,

            response: answer,

        };

    }

    catch (error) {

        console.error(
            "Chat Agent Error:",
            error
        );


        return {

            ...state,

            error: error.message,

        };

    }

}