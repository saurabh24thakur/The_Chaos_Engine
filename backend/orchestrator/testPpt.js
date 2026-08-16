import axios from "axios";
import { configDotenv } from "dotenv";
import path from "node:path";

configDotenv();

const apiKey = process.env.GOOGLE_API_KEY;

const CHAT_URL = "http://localhost:8002";
const ORCHESTRATOR_URL = "http://localhost:8003";

async function runTest(promptText) {
    try {
        console.log(`\n========================================`);
        console.log(`Running test for prompt: "${promptText}"`);
        console.log(`========================================`);

        // 1. Create a chat
        console.log("Creating test chat...");
        const createRes = await axios.post(`${CHAT_URL}/chat`, { userId: "test-user-id" });
        const chatId = createRes.data._id || createRes.data.data?._id;
        if (!chatId) {
            throw new Error(`Failed to create chat. Response: ${JSON.stringify(createRes.data)}`);
        }
        console.log(`Chat created with ID: ${chatId}`);

        // 2. Set chat config
        console.log("Setting chat config to Google Gemini...");
        await axios.put(`${CHAT_URL}/chat/config/${chatId}`, {
            provider: "google",
            model: "gemini-2.5-flash"
        });

        // 3. Execute chat
        console.log("Sending prompt to PPT orchestrator...");
        const chatRes = await axios.post(`${ORCHESTRATOR_URL}/chat`, {
            workspace: "ppt",
            chatId,
            prompt: promptText,
            provider: "google",
            model: "gemini-2.5-flash",
            apiKey: apiKey
        });

        console.log("Response Success:", chatRes.data.success);
        console.log("Response Text:", chatRes.data.response);
        if (chatRes.data.artifact) {
            console.log("Generated Artifact:", JSON.stringify(chatRes.data.artifact, null, 2));
        } else {
            console.log("Warning: No artifact was returned!");
        }
    } catch (err) {
        console.error("Test Error:", err.response?.data || err.message);
    }
}

async function main() {
    const prompt = process.argv[2] || "Create a 5 slide presentation comparing MongoDB and PostgreSQL";
    await runTest(prompt);
}

main();
