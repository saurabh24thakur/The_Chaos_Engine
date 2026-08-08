import GraphRegistry from "../graph/graph.registry.js";
import ChatService from "../services/chat.service.js";

<<<<<<< Updated upstream
export const executeChat = async (req, res) => {

    try {

        const { chatId, prompt } = req.body;

        if (!chatId) {

            return res.status(400).json({
=======

/**
 * Normal Chat
 */
export const chat = async (req, res) => {

    try {

        const {
            workspace,
            chatId,
            prompt,
        } = req.body;


        const graph =
            GraphRegistry.getGraph(workspace);


        const result =
            await graph.invoke({

                workspace,

                chatId,

                prompt,

            });


        res.json({

            success: true,

            response: result.response,

        });

    }

    catch (error) {

        console.error(error);


        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/**
 * Streaming Chat
 */
export const chatStream = async (req, res) => {

    try {

        const {
            workspace,
            chatId,
            prompt,
        } = req.body;


        const graph =
            GraphRegistry.getGraph(workspace);


        
        res.setHeader(
            "Content-Type",
            "text/event-stream"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache, no-transform"
        );

        res.setHeader(
            "Connection",
            "keep-alive"
        );


        res.flushHeaders();



        const stream =
            await graph.stream(

                {
                    workspace,
                    chatId,
                    prompt,
                },

                {
                    streamMode: "custom",
                }

            );


      

        for await (
            const chunk of stream
        ) {

            res.write(

                `data: ${JSON.stringify(chunk)}\n\n`

            );


            if (
                typeof res.flush === "function"
            ) {

                res.flush();

            }

        }


      

        res.write(

            `data: ${JSON.stringify({
                type: "done",
            })}\n\n`

        );


        res.end();

    }

    catch (error) {

        console.error(
            "Streaming error:",
            error
        );


        if (!res.headersSent) {

            return res.status(500).json({
>>>>>>> Stashed changes

                success: false,

                message: "chatId is required"

            });

<<<<<<< Updated upstream
        }

        if (!prompt) {

            return res.status(400).json({

                success: false,

                message: "prompt is required"

            });

        }

        // Fetch previous conversation

        const messages = await ChatService.getMessages(chatId);

        // Add latest user message

        messages.push({

            role: "user",

            content: prompt

        });

        // Get Graph

        const graph = GraphRegistry.getGraph("chat");

        // Invoke LangGraph

        const result = await graph.invoke({

            workspace: "chat",

            chatId,

            messages,

            response: ""

        });

        // Save assistant message

        await ChatService.saveMessage(chatId, {

            role: "assistant",

            content: result.response

        });

        return res.json({

            success: true,

            answer: result.response

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });
=======
        }


        res.write(

            `data: ${JSON.stringify({

                type: "error",

                message: error.message,

            })}\n\n`

        );


        res.end();
>>>>>>> Stashed changes

    }

};