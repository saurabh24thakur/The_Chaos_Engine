import dotenv from "dotenv";

dotenv.config();

const env = {

    PORT: process.env.PORT || 8002,

    MONGODB_URI: process.env.MONGODB_URI,

    NODE_ENV: process.env.NODE_ENV || "development",

    CORS_ORIGIN: process.env.CORS_ORIGIN || "*"

};

export default env;