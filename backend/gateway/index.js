import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";


import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import agentRoutes from "./routes/agent.route.js";


const app = express();


// middleware

app.use(cors());
app.use(helmet());
app.use(
  compression({
    filter: (req, res) => {
      const contentType = res.getHeader("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/orchestrator", agentRoutes);







app.get("/", (req, res) => {
  res.send("Hello from the gateway!");
});

const PORT = process.env.PORT || 8000;  

app.listen(PORT, () => {
  console.log(`Gateway server is running on port ${PORT}`);
}
)

