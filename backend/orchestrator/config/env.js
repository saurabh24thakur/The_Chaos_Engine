import dotenv from "dotenv";

dotenv.config();

export default {

    PORT: process.env.PORT || 8003,

    CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL,

    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8001",

    SEARCH_API_KEY: process.env.SEARCH_API_KEY || process.env.TAVILY_API_KEY,

    TAVILY_API_KEY: process.env.TAVILY_API_KEY,

    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

    GROQ_API_KEY: process.env.GROQ_API_KEY,

    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,

    INTERNAL_SERVICE_TOKEN:
        process.env.INTERNAL_SERVICE_TOKEN ||
        "chaos-engine-internal-dev"

};
