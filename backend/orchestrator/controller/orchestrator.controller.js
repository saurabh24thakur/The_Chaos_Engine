import GraphRegistry from "../graph/graph.registry.js";

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

export const chatStream = async (req, res) => {

    try {

        const {

            workspace,

            chatId,

            prompt,

        } = req.body;

        const graph =
            GraphRegistry.getGraph(workspace);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        await graph.invoke({

            workspace,

            chatId,

            prompt,

            onToken: (token) => {

                res.write(`data: ${JSON.stringify({ token })}\n\n`);
                if (typeof res.flush === "function") {
                    res.flush();
                }

            }

        });

        res.write("data: [DONE]\n\n");
        if (typeof res.flush === "function") {
            res.flush();
        }
        res.end();

    }

    catch (error) {

        console.error(error);

        if (!res.headersSent) {

            res.status(500).json({

                success: false,

                message: error.message,

            });

        } else {

            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            if (typeof res.flush === "function") {
                res.flush();
            }
            res.end();

        }

    }

};