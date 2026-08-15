import BaseProvider from "./base.provider.js";
import env from "../config/env.js";
import { getDefaultModel } from "../config/model.js";

function normalizeMessages(messages) {
  return Array.isArray(messages)
    ? messages
        .map((message) => {
          if (typeof message === "string") {
            return { role: "user", content: message };
          }

          if (!message || typeof message !== "object") {
            return null;
          }

          if (!message.role && message.content === undefined) {
            return null;
          }

          return {
            role: message.role || "user",
            content:
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content ?? ""),
          };
        })
        .filter(Boolean)
    : [];
}

async function readError(response) {
  try {
    const data = await response.json();
    return (
      data?.error?.message ||
      data?.message ||
      (typeof data === "string" ? data : JSON.stringify(data))
    );
  } catch {
    return response.statusText || "Unknown provider error";
  }
}

async function* parseStream(response) {
  const reader = response.body?.getReader();

  if (!reader) {
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");

    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");

      if (!line.startsWith("data:")) {
        continue;
      }

      const data = line.slice(5).trim();

      if (!data || data === "[DONE]") {
        continue;
      }

      try {
        const json = JSON.parse(data);
        const content = json?.choices?.[0]?.delta?.content;

        if (content) {
          yield content;
        }
      } catch {
        continue;
      }
    }
  }
}

class OpenAIProvider extends BaseProvider {
  constructor(apiKey = env.OPENAI_API_KEY) {
    super("OpenAI");
    this.apiKey = apiKey;
  }

  getBaseUrl() {
    return "https://api.openai.com/v1/chat/completions";
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  buildPayload({ model, messages, options = {}, stream = false }) {
    const normalizedMessages = normalizeMessages(messages);

    if (normalizedMessages.length === 0) {
      throw new Error("No messages were provided.");
    }

    return {
      model: model || getDefaultModel("openai"),
      messages: normalizedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? options.max_tokens,
      stream,
    };
  }

  async request({ model, messages, options = {}, stream = false }) {
    if (!this.apiKey) {
      throw new Error("API key is required for OpenAI.");
    }

    const response = await fetch(this.getBaseUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(
        this.buildPayload({
          model,
          messages,
          options,
          stream,
        })
      ),
    });

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    return response;
  }

  async generate({ model, messages, options = {} }) {
    const response = await this.request({
      model,
      messages,
      options,
      stream: false,
    });
    const data = await response.json();

    return data?.choices?.[0]?.message?.content || "";
  }

  async *stream({ model, messages, options = {} }) {
    const response = await this.request({
      model,
      messages,
      options,
      stream: true,
    });

    yield* parseStream(response);
  }
}

export default OpenAIProvider;

