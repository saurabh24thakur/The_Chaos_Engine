import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true,
        index: true
    },

    title: {
        type: String,
        default: "New Chat"
    }

}, {

    timestamps: true

});

export default mongoose.model("Chat", chatSchema);