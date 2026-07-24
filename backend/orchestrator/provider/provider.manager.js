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
                    model: config.model
                };

            case "groq":
                throw new Error("Groq Provider not implemented.");

            case "huggingface":
                throw new Error("HuggingFace Provider not implemented.");

            default:
                throw new Error("Unsupported provider.");

        }

    }

}

export default ProviderManager;