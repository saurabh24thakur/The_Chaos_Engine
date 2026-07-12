import express from "express";
import { configDotenv } from "dotenv";

configDotenv();


const app = express();

app.get("/", (req, res) => {
  res.send("Hello from Agent");
});


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {        

    console.log(`agent server is running on port ${PORT}`);
})