import GraphRegistry from "../graph/graph.registry.js";
import ChatService from "../services/chat.service.js";

export const executeChat = async (req, res) => {

    try {

        const { chatId, prompt } = req.body;

        if (!chatId) {

            return res.status(400).json({

                success: false,

                message: "chatId is required"

            });

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

    }

};