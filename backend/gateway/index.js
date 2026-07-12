import express from "express";
import { configDotenv } from "dotenv";


const app = express();
configDotenv();



app.get("/", (req, res) => {
  res.send("Hello from the gateway!");
});

const PORT = process.env.PORT || 8000;  

app.listen(PORT, () => {
  console.log(`Gateway server is running on port ${PORT}`);
}
)

