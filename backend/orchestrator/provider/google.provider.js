import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import BaseProvider from "./base.provider.js";

import env from "../config/env.js";

class GoogleProvider extends BaseProvider {

    constructor() {
<<<<<<< Updated upstream
        super(env.GOOGLE_API_KEY);
    }

    async generate({ model, messages }) {

        const llm = new ChatGoogleGenerativeAI({

            apiKey: this.apiKey,
=======

        super("Google");

        this.client = new GoogleGenAI({
            apiKey: env.GOOGLE_API_KEY,
        });

    }

    /**
     * Normal AI response
     */
    async generate({ model, messages }) {

        const prompt = messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n");

        const response =
            await this.client.models.generateContent({
>>>>>>> Stashed changes

                model,

<<<<<<< Updated upstream
            temperature: 0.7
=======
                contents: prompt,
>>>>>>> Stashed changes

            });

        const response = await llm.invoke(messages);

        return response.content;

    }

<<<<<<< Updated upstream
    async stream({ model, messages }) {

        const llm = new ChatGoogleGenerativeAI({

            apiKey: this.apiKey,
=======
    /**
     * Streaming AI response
     */
    async *stream({ model, messages }) {

        const prompt = messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n");

        const responseStream =
            await this.client.models.generateContentStream({
>>>>>>> Stashed changes

                model,

<<<<<<< Updated upstream
            temperature: 0.7
=======
                contents: prompt,
>>>>>>> Stashed changes

            });

<<<<<<< Updated upstream
        return llm.stream(messages);
=======
        for await (const chunk of responseStream) {

            const text = chunk.text;

            if (text) {

                yield text;

            }

        }
>>>>>>> Stashed changes

    }

}

export default GoogleProvider;