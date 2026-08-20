import mongoose from "mongoose";
import dns from "node:dns";
import { configDotenv } from "dotenv";

configDotenv();

const clearDB = async () => {
    try {
        dns.setServers(["8.8.8.8", "8.8.4.4"]);
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB.");
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'users' }).toArray();
        
        if (collections.length > 0) {
            await db.dropCollection('users');
            console.log("SUCCESS: 'users' collection dropped!");
        } else {
            console.log("The 'users' collection does not exist (already clean).");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error clearing DB:", error);
        process.exit(1);
    }
};

clearDB();
