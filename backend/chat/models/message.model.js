import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    chatId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Chat",

        required: true,

        index: true

    },

    role: {

        type: String,

        enum: ["user", "assistant", "system"],

        required: true

    },

    content: {

        type: String,

        required: true

    },

    artifact: {

        type: mongoose.Schema.Types.Mixed,

        default: null

    }

}, {

    timestamps: true

});

export default mongoose.model("Message", messageSchema);
