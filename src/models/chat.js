const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        "senderId": {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        "text": {
            type: String,
            required: true,
        },
    },
    {
    timestamps: true,
    },
);

module.exports = mongoose.model("Chat", chatSchema);