import MODELS from "../config/model.js";

import env from "../config/env.js";

import GoogleProvider from "./google.provider.js";

const PROVIDER_ENV_KEYS = {
    google: "GOOGLE_API_KEY",
    groq: "GROQ_API_KEY",
    huggingface: "HUGGINGFACE_API_KEY",
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
};

function normalizeInput(input) {
    if (typeof input === "string") {
        return { workspace: input };
    }

    return input || {};
}

function resolveLegacyConfig(workspace) {
    if (!workspace) {
        return {};
    }

    return MODELS[workspace] || {};
}

function resolveApiKey(providerName, apiKey) {
    if (apiKey) {
        return apiKey;
    }

    const envKey = PROVIDER_ENV_KEYS[providerName];

    if (envKey && env[envKey]) {
        return env[envKey];
    }

    return null;
}

export function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .map((message) => ({
            role: String(message?.role || "").trim(),
            content: typeof message?.content === "string"
                ? message.content
                : String(message?.content ?? ""),
        }))
        .filter((message) => message.role && message.content);
}

async function createProvider(providerName, apiKey) {
    switch (providerName) {
        case "google":
            return new GoogleProvider(apiKey);

        case "groq": {
            try {
                const mod = await import("./groq.provider.js");
                return new mod.default(apiKey);
            } catch {
                throw new Error(
                    "Groq provider is unavailable. Install 'groq-sdk' to enable it."
                );
            }
        }

        case "huggingface": {
            try {
                const mod = await import("./huggingFace.provider.js");
                return new mod.default(apiKey);
            } catch {
                throw new Error(
                    "HuggingFace provider is unavailable. Install '@huggingface/inference' to enable it."
                );
            }
        }

        case "openai": {
            try {
                const mod = await import("./openai.provider.js");
                return new mod.default(apiKey);
            } catch {
                throw new Error(
                    "OpenAI provider is unavailable."
                );
            }
        }

        case "openrouter": {
            try {
                const mod = await import("./openrouter.provider.js");
                return new mod.default(apiKey);
            } catch {
                throw new Error(
                    "OpenRouter provider is unavailable."
                );
            }
        }

        default:
            throw new Error(`Provider '${providerName}' not supported.`);
    }
}

class ProviderManager {

    static async getProvider(input) {
        const config = normalizeInput(input);
        const legacy = resolveLegacyConfig(config.workspace);

        let providerName =
            String(config.provider || legacy.provider || "")
                .trim()
                .toLowerCase();

        if (providerName === "gemini") {
            providerName = "google";
        }

        if (!providerName) {
            throw new Error("Provider is required.");
        }

        const model =
            String(config.model || legacy.model || "")
                .trim();

        if (!model) {
            throw new Error("Model is required.");
        }

        const apiKey = resolveApiKey(providerName, config.apiKey);

        if (!apiKey) {
            throw new Error(
                `API key is required for provider '${providerName}'.`
            );
        }

        const provider = await createProvider(providerName, apiKey);

        return {
            provider,
            model,
            providerName,
        };
    }

    static async generate({
        workspace,
        provider,
        apiKey,
        model,
        messages,
        options,
    }) {
        const resolved = await this.getProvider({
            workspace,
            provider,
            apiKey,
            model,
        });

        return await resolved.provider.generate({
            model: resolved.model,
            messages: sanitizeMessages(messages),
            options,
        });
    }

    static async *stream({
        workspace,
        provider,
        apiKey,
        model,
        messages,
        options,
    }) {
        const resolved = await this.getProvider({
            workspace,
            provider,
            apiKey,
            model,
        });

        if (typeof resolved.provider.stream !== "function") {
            throw new Error(
                `Provider '${resolved.providerName}' does not support streaming.`
            );
        }

        for await (const chunk of resolved.provider.stream({
            model: resolved.model,
            messages: sanitizeMessages(messages),
            options,
        })) {
            yield chunk;
        }
    }

}

export default ProviderManager;
