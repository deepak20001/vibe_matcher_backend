const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
        }, 
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { 
        timestamps: true,
    }
); 

const chatSchema = new mongoose.Schema(
    {
        participants: [
            { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "User", 
                required: true 
            },
        ],
        messages: [messageSchema],
    },
    {
    timestamps: true,
    },
);

module.exports = mongoose.model("Chat", chatSchema);