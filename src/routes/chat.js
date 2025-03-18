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

        if(chats == null) {
            const newChat = new Chat({
                participants: [userId, receiverUserId],
                messages: [],
            });

            res.json({
                success: true,
                message: "Chat fetched successfully!",
                data: newChat,
            });
        } else {
            // Mark unread messages as read
            const updatedMessages = chats.messages.map((message) => {
                if(!message.isRead) {
                    message.isRead = true;
                }
                return message;
            }) 

            chats.messages = updatedMessages;
            await chats.save();

                
            res.json({
                success: true,
                message: "Chat fetched successfully!",
                data: chats,
            });
        }
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

chatRouter.patch("/mark-as-read/:senderUserId/:messageId", userAuth, async (req, res) => {
    try {
        const { senderUserId, messageId} = req.params;
        
        if(!mongoose.isValidObjectId(senderUserId)) {
            throw new Error("Invalid sender user ID");
        }

        if(!mongoose.isValidObjectId(messageId)) {
            throw new Error("Invalid message ID");
        }
        
        const userId = req.user._id;

        const chat = await Chat.findOne({
            participants: {
                $all: [userId, senderUserId],
            }
        })

        if(!chat) {
            throw new Error("Chat not found");
        }

        const message = chat.messages.find(msg => msg._id.toString() === messageId);
        message.isRead = true;
        await chat.save();

        res.json({
            success: true,
            message: "Message marked as read",
        })
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