import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import BaseProvider from "./base.provider.js";

import env from "../config/env.js";

class GoogleProvider extends BaseProvider {

    constructor() {
        super(env.GOOGLE_API_KEY);
    }

    async generate({ model, messages }) {

        const llm = new ChatGoogleGenerativeAI({

            apiKey: this.apiKey,

            model,

            temperature: 0.7

        });

        const response = await llm.invoke(messages);

        return response.content;

    }

    async stream({ model, messages }) {

        const llm = new ChatGoogleGenerativeAI({

            apiKey: this.apiKey,

            model,

            temperature: 0.7

        });

        return llm.stream(messages);

    }

}

export default GoogleProvider;