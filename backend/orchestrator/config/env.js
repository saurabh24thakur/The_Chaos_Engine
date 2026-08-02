import dotenv from "dotenv";

dotenv.config();

export default {

    PORT: process.env.PORT,

    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

    GROQ_API_KEY: process.env.GROQ_API_KEY,

    HUGGINGFACE_API_KEY:
        process.env.HUGGINGFACE_API_KEY,

    CHAT_SERVICE_URL:
        process.env.CHAT_SERVICE_URL,

};