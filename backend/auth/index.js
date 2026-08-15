import express from "express";
import { configDotenv } from "dotenv";
import { connectDB } from "./utils/db.js";
import clerkWebhookRouter from "./routes/clerkWebhook.js";
import userRouter from "./routes/user.js";
import settingsRouter from "./routes/settings.js";

configDotenv();

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.send("Hello from Auth");
});

app.use("/webhooks", clerkWebhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRouter);
app.use("/api/settings", settingsRouter);

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
});
