import { GoogleGenAI } from "@google/genai";
import env from "../config/env.js";
import BaseProvider from "./base.provider.js";

class GoogleProvider extends BaseProvider {

    constructor() {
        super("Google");

        this.client = new GoogleGenAI({
            apiKey: env.GOOGLE_API_KEY,
        });
    }

    /**
     * Generate AI response
     */
    async generate({ model, messages }) {

        // Convert chat history into a single prompt
        const prompt = messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n");

        const response = await this.client.models.generateContent({

            model,

            contents: prompt,

        });

        return response.text;

    }

    /**
     * Stream AI response
     */
    async *stream({ model, messages }) {

        // Convert chat history into a single prompt
        const prompt = messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n");

        const responseStream = await this.client.models.generateContentStream({

            model,

            contents: prompt,

        });

        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    }
}

export default GoogleProvider;