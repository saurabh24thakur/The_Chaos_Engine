import ProviderManager from "../../provider/provider.manager.js";

import chatService from "../../services/chat.service.js";


export async function chatTool(state, config) {

    try {

        const {
            chatId,
            prompt,
            workspace,
        } = state;


        
        //  Save user message

        await chatService.saveMessage(
            chatId,
            {
                role: "user",
                content: prompt,
            }
        );


        //  Load conversation

        const history =
            await chatService.getMessages(chatId);

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

        await chatService.saveMessage(

            chatId,
            {
                role: "assistant",
                content: answer,
            }

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
