import express from "express";
import { configDotenv } from "dotenv";

configDotenv();

import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import orchestratorRoutes from "./routes/orchestrator.routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());

app.use(express.json());

app.use('/api/orchestrator', orchestratorRoutes);
app.use('/', orchestratorRoutes);



app.get("/", (req, res) => {
  res.send("Hello from Agent");
});


const PORT = process.env.PORT || 8003;

app.listen(PORT, () => {

    console.log(`agent server is running on port ${PORT}`);
})


