import MODELS from "../config/model.js";

import GoogleProvider from "./google.provider.js";
import GroqProvider from "./groq.provider.js";
import HuggingFaceProvider from "./huggingFace.provider.js";

class ProviderManager {

    constructor() {

        this.providers = {

            google: new GoogleProvider(),

            groq: new GroqProvider(),

            huggingface: new HuggingFaceProvider(),

        };

    }

    getProvider(workspace) {

        const config = MODELS[workspace];

        if (!config) {

            throw new Error(

                `Workspace '${workspace}' not found.`

            );

        }

        const provider =
            this.providers[config.provider];

        if (!provider) {

            throw new Error(

                `Provider '${config.provider}' not supported.`

            );

        }

        return {

            provider,

            model: config.model,

        };

    }

}

export default new ProviderManager();