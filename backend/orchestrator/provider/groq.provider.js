import Groq from "groq-sdk";

import env from "../config/env.js";
import { getDefaultModel } from "../config/model.js";
import BaseProvider from "./base.provider.js";

class GroqProvider extends BaseProvider {

    constructor(apiKey = env.GROQ_API_KEY) {

        super("Groq");

        this.client = new Groq({
            apiKey,
        });

    }

    async generate({
        model,
        messages,
        options = {},
    }) {

        const completion =
            await this.client.chat.completions.create({

                model:
                    model ||
                    getDefaultModel("groq"),

                temperature:
                    options.temperature ?? 0.7,

                messages,

            });

        return completion
            .choices[0]
            .message
            .content;

    }

    async *stream({
        model,
        messages,
        options = {},
    }) {

        const completionStream =
            await this.client.chat.completions.create({

                model:
                    model ||
                    getDefaultModel("groq"),

                temperature:
                    options.temperature ?? 0.7,

                messages,

                stream: true,

            });

        for await (
            const chunk of completionStream
        ) {

            const content =
                chunk.choices[0]?.delta?.content || "";

            if (content) {

                yield content;

            }

        }

    }

}

export default GroqProvider;
