import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { connectDB } from "./utils/db.js";


import settingsRouter from "./routes/settings.js";

configDotenv();

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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
