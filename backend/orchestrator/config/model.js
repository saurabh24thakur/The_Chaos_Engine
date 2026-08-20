const PROVIDER_CATALOG = {
  google: {
    provider: "google",
    label: "Gemini",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
    ],
  },
  openai: {
    provider: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4.1-mini",
    models: [
      "gpt-4.1-mini",
      "gpt-4.1",
      "gpt-4o-mini",
    ],
  },
  openrouter: {
    provider: "openrouter",
    label: "OpenRouter",
    defaultModel: "openrouter/auto",
    models: [
      "openrouter/auto",
      "openai/gpt-4.1-mini",
      "anthropic/claude-3.5-sonnet",
      "meta-llama/llama-3.3-70b-instruct",
    ],
  },
  groq: {
    provider: "groq",
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen/qwen3.6-27b",
      "openai/gpt-oss-120b",
      "whisper-large-v3-turbo",
    ],
  },
  huggingface: {
    provider: "huggingface",
    label: "Hugging Face",
    defaultModel: "black-forest-labs/FLUX.1-dev",
    models: [
      "black-forest-labs/FLUX.1-dev",
    ],
  },
};

const WORKSPACE_DEFAULTS = {
  chat: {
    provider: "google",
    model: PROVIDER_CATALOG.google.defaultModel,
  },
  search: {
    provider: "google",
    model: PROVIDER_CATALOG.google.defaultModel,
  },
  coding: {
    provider: "google",
    model: PROVIDER_CATALOG.google.defaultModel,
  },
  pdf: {
    provider: "google",
    model: PROVIDER_CATALOG.google.defaultModel,
  },
  ppt: {
    provider: "google",
    model: PROVIDER_CATALOG.google.defaultModel,
  },
  image: {
    provider: "huggingface",
    model: PROVIDER_CATALOG.huggingface.defaultModel,
  },
};

export function getProviderCatalog() {
  return Object.values(PROVIDER_CATALOG);
}

export function getProviderDefinition(provider) {
  return PROVIDER_CATALOG[String(provider || "").trim().toLowerCase()] || null;
}

export function getDefaultModel(provider) {
  return getProviderDefinition(provider)?.defaultModel || "";
}

export function getWorkspaceDefault(workspace) {
  return WORKSPACE_DEFAULTS[String(workspace || "").trim().toLowerCase()] || null;
}

export function getSupportedProviders() {
  return Object.keys(PROVIDER_CATALOG);
}

export default WORKSPACE_DEFAULTS;

