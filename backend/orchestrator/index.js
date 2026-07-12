import express from "express";
import { configDotenv } from "dotenv";

configDotenv();


const app = express();

app.get("/", (req, res) => {
  res.send("Hello from Auth");
});


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {        

    console.log(`Auth server is running on port ${PORT}`);
})