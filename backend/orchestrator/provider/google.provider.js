import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

import env from "../config/env.js";
import BaseProvider from "./base.provider.js";

class GoogleProvider extends BaseProvider {

    constructor() {
        super("Google");
        this.apiKey = env.GOOGLE_API_KEY;
    }

    getClient(model) {
        return new ChatGoogleGenerativeAI({
            apiKey: this.apiKey,
            model: model || "gemini-2.5-flash",
            temperature: 0.7,
        });
    }

    formatMessages(messages) {
        const safeMessages = Array.isArray(messages) ? messages : [];

        return safeMessages.map((message) => {
            if (typeof message === "string") {
                return new HumanMessage(message);
            }

            if (message?.role === "user") {
                return new HumanMessage(message.content);
            }

            if (message?.role === "assistant") {
                return new AIMessage(message.content);
            }

            if (message?.role === "system") {
                return new SystemMessage(message.content);
            }

            return new HumanMessage(message?.content ?? "");
        });
    }

    async generate({
        model,
        messages,
    }) {
        const client = this.getClient(model);
        const formattedMessages = this.formatMessages(messages);

        if (formattedMessages.length === 0) {
            throw new Error(
                "No messages were provided to GoogleProvider.generate()."
            );
        }

        const response = await client.invoke(formattedMessages);
        return response.content;
    }

    async *stream({
        model,
        messages,
    }) {
        const client = this.getClient(model);
        const formattedMessages = this.formatMessages(messages);

        if (formattedMessages.length === 0) {
            throw new Error(
                "No messages were provided to GoogleProvider.stream()."
            );
        }

        const stream = await client.stream(formattedMessages);

        for await (const chunk of stream) {
            if (!chunk.content) {
                continue;
            }

            if (typeof chunk.content === "string") {
                yield chunk.content;
                continue;
            }

            if (Array.isArray(chunk.content)) {
                for (const item of chunk.content) {
                    if (typeof item === "string") {
                        yield item;
                    } else if (item?.text) {
                        yield item.text;
                    }
                }
            }
        }
    }

}

export default GoogleProvider;
