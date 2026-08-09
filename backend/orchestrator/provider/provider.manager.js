import MODELS from "../config/model.js";

import GoogleProvider from "./google.provider.js";

class ProviderManager {

    static getProvider(workspace) {
        const config = MODELS[workspace];

        if (!config) {
            throw new Error(`Workspace '${workspace}' not found.`);
        }

        switch (config.provider) {
            case "google":
                return {
                    provider: new GoogleProvider(),
                    model: config.model,
                };

            case "groq":
                throw new Error(
                    "Groq provider is not available in this install. Install 'groq-sdk' and re-enable the provider."
                );

            case "huggingface":
                throw new Error(
                    "HuggingFace provider is not available in this install."
                );

            default:
                throw new Error(
                    `Provider '${config.provider}' not supported.`
                );
        }
    }

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

    async *stream({
        workspace,
        messages,
    }) {
        const {
            provider,
            model,
        } = this.getProvider(workspace);

        if (typeof provider.stream !== "function") {
            throw new Error(
                `Provider '${provider.name}' does not support streaming.`
            );
        }

        for await (const chunk of provider.stream({
            model,
            messages,
        })) {
            yield chunk;
        }
    }

}

export default ProviderManager;
