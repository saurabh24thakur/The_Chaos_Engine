import dotenv from "dotenv";

dotenv.config();

export default {

    PORT: process.env.PORT || 8003,

    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

    GROQ_API_KEY: process.env.GROQ_API_KEY,

    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY

};