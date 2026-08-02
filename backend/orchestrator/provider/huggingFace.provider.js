import { InferenceClient } from "@huggingface/inference";

import BaseProvider from "./base.provider.js";

import env from "../config/env.js";

class HuggingFaceProvider extends BaseProvider {

    constructor() {

        super("HuggingFace");

        this.client = new InferenceClient(

            env.HUGGINGFACE_API_KEY

        );

    }

    async generate({

        model,

        messages,

    }) {

        const completion =
            await this.client.chatCompletion({

                model,

                messages,

                max_tokens: 1024,

            });

        return completion
            .choices[0]
            .message
            .content;

    }

    async *stream({ model, messages }) {

        const completionStream =
            await this.client.chatCompletionStream({

                model,

                messages,

                max_tokens: 1024,

            });

        for await (const chunk of completionStream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                yield content;
            }
        }

    }

}

export default HuggingFaceProvider;