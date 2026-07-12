import mongoose from "mongoose";
import dns from "node:dns";

export const connectDB = async () => {
    try {   
        // Force public DNS to resolve MongoDB Atlas SRV records
        dns.setServers(["8.8.8.8", "8.8.4.4"]);

        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }   catch (error) { 
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

};