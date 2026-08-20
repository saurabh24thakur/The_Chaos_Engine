import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { connectDB } from "./utils/db.js";


import settingsRouter from "./routes/settings.js";

configDotenv();

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Always allow requests coming from Vercel or localhost
    if (origin.includes('vercel.app') || origin.includes('pages.dev') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, origin);
    }
    
    // If it doesn't match, just reflect the origin anyway for now to prevent strict blocking in preview,
    // but in a real prod app you would return callback(null, false)
    return callback(null, origin);
  },
  credentials: true
}));
connectDB();

app.get("/", (req, res) => {
  res.send("Hello from Auth");
});

import authRouter from "./routes/auth.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);

app.use("/api/settings", settingsRouter);

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
});
