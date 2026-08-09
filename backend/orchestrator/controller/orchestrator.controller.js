import GraphRegistry from "../graph/graph.registry.js";

export const executeChat = async (req, res) => {
    try {
        const {
            workspace,
            chatId,
            prompt,
        } = req.body;

        const graph = GraphRegistry.getGraph(workspace);

        const result = await graph.invoke({
            workspace,
            chatId,
            prompt,
        });

        res.json({
            success: true,
            response: result.response,
        });
    } catch (error) {
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

        const graph = GraphRegistry.getGraph(workspace);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const stream = await graph.stream(
            {
                workspace,
                chatId,
                prompt,
            },
            {
                streamMode: "custom",
            }
        );

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);

            if (typeof res.flush === "function") {
                res.flush();
            }
        }

        res.write(
            `data: ${JSON.stringify({
                type: "done",
            })}\n\n`
        );

        res.end();
    } catch (error) {
        console.error("Streaming error:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

        res.write(
            `data: ${JSON.stringify({
                type: "error",
                message: error.message,
            })}\n\n`
        );

        res.end();
    }
};
