import ProviderManager from "../provider/provider.manager.js";

export const executeChat = async (req, res) => {

    try {

        const { prompt } = req.body;

        const { provider, model } = ProviderManager.getProvider("chat");

        const answer = await provider.generate({

            model,

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]

        });

        return res.json({

            success: true,

            answer

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};