import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
    try {
        // Force public DNS to resolve MongoDB Atlas SRV records
        dns.setServers(["8.8.8.8", "8.8.4.4"]);

        await mongoose.connect(process.env.MONGO_URL || process.env.MONGO_URI);

        console.log("MongoDB Connected");

    } catch (err) {

        console.log(err.message);

        process.exit(1);
    }
};

export default connectDB;