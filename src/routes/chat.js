const express = require("express");
const userAuth = require("../middlewares/userAuth");
const mongoose = require("mongoose");
const Chat = require("../models/chat");

const chatRouter = express.Router();

chatRouter.get("/chats/:receiverUserId", userAuth, async(req, res) => {
    try {
        const { receiverUserId } = req.params; 

        if(!receiverUserId) {
            throw new Error("Receiver user ID is required");
        }

        if(!mongoose.isValidObjectId(receiverUserId)) {
            throw new Error("Invalid receiver user ID");
        }

        const userId = req.user._id;

        const chats = await Chat.findOne({
            participants: { $all: [userId, receiverUserId] },
        });

        res.json({
            success: true,
            message: "Chats fetched successfully!", 
            data: chats,
        });
    } catch (err) {
        console.error({
            code: err.code || "UNKNOWN_ERROR",
            details: err.stack,
        });
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
});

module.exports = chatRouter;