import OpenAIProvider from "./openai.provider.js";
import env from "../config/env.js";

class OpenRouterProvider extends OpenAIProvider {
  constructor(apiKey = env.OPENROUTER_API_KEY) {
    super(apiKey);
    this.name = "OpenRouter";
  }

  getBaseUrl() {
    return "https://openrouter.ai/api/v1/chat/completions";
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost",
      "X-Title": process.env.OPENROUTER_TITLE || "Chaos Engine",
    };
  }
}

export default OpenRouterProvider;

