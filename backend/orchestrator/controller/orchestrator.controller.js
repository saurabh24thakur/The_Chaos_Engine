export const executeChat = async (req, res) => {

    try {

        res.json({
            success: true,
            message: "Orchestrator is working."
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};