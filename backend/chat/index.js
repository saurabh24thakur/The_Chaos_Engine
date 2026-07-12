import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import chatRoutes from "./routes/chat.route.js";
import connectDB from "./config/db.js";
import messageRoutes from "./routes/message.routes.js";


await connectDB();


const app = express();



const PORT = process.env.PORT || 8002;


// middlewares


app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());

app.use("/chat", chatRoutes);
app.use("/messages", messageRoutes);


app.get("/", (req, res) => {
  res.send("Hello from chat");
});




app.listen(PORT, () => {        

    console.log(`Auth server is running on port ${PORT}`);
})