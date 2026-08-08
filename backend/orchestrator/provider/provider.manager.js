import MODELS from "../config/model.js";

import GoogleProvider from "./google.provider.js";

class ProviderManager {

<<<<<<< Updated upstream
    static getProvider(workspace) {
=======
    constructor() {

        this.providers = {

            google: new GoogleProvider(),

            groq: new GroqProvider(),

            huggingface: new HuggingFaceProvider(),

        };

    }


    /**
     * Get provider and model
     * based on workspace
     */
    getProvider(workspace) {
>>>>>>> Stashed changes

        const config = MODELS[workspace];

        if (!config) {
<<<<<<< Updated upstream
            throw new Error(`Workspace '${workspace}' not found.`);
=======

            throw new Error(
                `Workspace '${workspace}' not found.`
            );

>>>>>>> Stashed changes
        }

        switch (config.provider) {

            case "google":
                return {
                    provider: new GoogleProvider(),
                    model: config.model
                };

<<<<<<< Updated upstream
            case "groq":
                throw new Error("Groq Provider not implemented.");

            case "huggingface":
                throw new Error("HuggingFace Provider not implemented.");

            default:
                throw new Error("Unsupported provider.");
=======
            throw new Error(
                `Provider '${config.provider}' not supported.`
            );
>>>>>>> Stashed changes

        }

    }


    /**
     * Normal AI response
     */
    async generate({
        workspace,
        messages,
    }) {

        const {
            provider,
            model,
        } = this.getProvider(workspace);


        return await provider.generate({

            model,

            messages,

        });

    }


    /**
     * Streaming AI response
     */
    async *stream({
        workspace,
        messages,
    }) {

        const {
            provider,
            model,
        } = this.getProvider(workspace);


        // Check whether provider supports streaming
        if (
            typeof provider.stream !== "function"
        ) {

            throw new Error(

                `Provider '${provider.name}' does not support streaming.`

            );

        }


        // Forward chunks from provider
        for await (
            const chunk of provider.stream({

                model,

                messages,

            })
        ) {

            yield chunk;

        }

    }

}

<<<<<<< Updated upstream
export default ProviderManager;
=======

export default new ProviderManager();
>>>>>>> Stashed changes
