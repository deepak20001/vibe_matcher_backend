const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const Connection = require("../models/connection");
const Chat = require("../models/chat");
const userAuth = require("../middlewares/userAuth");

const connectionRouter = express.Router();

connectionRouter.get("/connections", userAuth, async(req, res) => {
    try {
        const connections = await Connection.find({
            $or: [
                { fromUserId: req.user?._id },
                { toUserId: req.user?._id },
            ],
            status: "accepted",
        }).populate("fromUserId toUserId", "name profilePhotos");
        
        // Get chats for all connections
        const formattedConnections = await Promise.all(connections.map( async connection => {
            // Find chat between these users
            const chat = await Chat.findOne({
                participants: {
                    $all: [
                        connection.fromUserId._id,
                        connection.toUserId._id,
                    ],
                },
            });
            
            // Get last message and unread count
            const lastMessage = (chat?.messages?.length > 0) ? 
                chat.messages[chat.messages.length - 1] : 
                null;
            
            // Count unread messages for logged in user
            const unreadCount = chat?.messages?.filter(msg => 
                msg.senderId.toString() !== req.user._id.toString() && !msg.isRead
            ).length || 0;

            return {
                ...connection._doc,
                fromUserData: connection.fromUserId,
                toUserData: connection.toUserId,
                lastMessage: lastMessage ? {
                    _id: lastMessage._id,
                    text: lastMessage.text,
                    senderId: lastMessage.senderId,
                    createdAt: lastMessage.createdAt,
                    isRead: lastMessage.isRead
                } : null,
                unreadCount,
                fromUserId: undefined,
                toUserId: undefined
            };
        }));
        
        // Sort by last message timestamp (most recent first)
        formattedConnections.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.createdAt;
            const timeB = b.lastMessage?.createdAt || b.createdAt;
            return new Date(timeB) - new Date(timeA);
        });

        res.json({
            success: true,
            message: "Connections fetched successfully!", 
            data: formattedConnections,
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

connectionRouter.get("/requests", userAuth, async(req, res) => {
    try {
        const connections = await Connection.find({
            toUserId: req.user?._id,
            status: "interested",
        }).populate("fromUserId", "name email profilePhotos");

        // Rename `fromUserId` to `fromUserData` in the response
        const formattedConnections = connections.map(connection => ({
            ...connection._doc,
            fromUserData: connection.fromUserId,
            fromUserId: undefined, // Remove the old field
        }));

        res.json({
            success: true,
            message: "Connection requests fetched successfully!", 
            data: formattedConnections,
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


connectionRouter.post("/send/:updateStatus/:toUserId", userAuth,  async (req, res) => {
    try {
        const { updateStatus, toUserId } = req.params;
        const loggedInUserId = req.user._id;

        if(!updateStatus || !toUserId) {
            throw new Error(((!updateStatus) ? "updateStatus" : "toUserId") + " is required");
        }

        const allowedStatus = ["interested"];
        if(!allowedStatus.includes(updateStatus)) {
            throw new Error("Invalid status: " + updateStatus);
        }

        if(!mongoose.isValidObjectId(toUserId)) {
            throw new Error("Invalid toUserId: " + toUserId);
        }

        const user = await User.findOne({ _id: toUserId });
        if(!user) {
            throw new Error("User not found");
        }

        if(loggedInUserId.toString() === toUserId.toString()) {
            throw new Error("Cannot send connection request to yourself");
        }

        const existingConnection = await Connection.findOne({
            $or: [
                {
                    fromUserId: loggedInUserId,
                    toUserId,
                },
                {
                    fromUserId: toUserId,
                    toUserId: loggedInUserId,
                },
            ],
        });

        if(existingConnection) {
            throw new Error("Connection request already exist");
        }

        const connectionRequest = new Connection({
            fromUserId: loggedInUserId,
            toUserId: toUserId,
            status: updateStatus,
        });

        const savedConnectionRequest = await connectionRequest.save();

        res.json({
            success: true,
            message: "Connection request updated successfully!", 
            data: savedConnectionRequest, 
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

connectionRouter.patch("/review/:updateStatus/:fromUserId", userAuth, async (req, res) => {
    try {
        const { updateStatus, fromUserId } = req.params;
        
        if(!updateStatus || !fromUserId) {
            throw new Error(((!updateStatus) ? "updateStatus" : "fromUserId") + " is required");
        }

        const allowedStatus = ["accepted", "rejected"];

        if(!allowedStatus.includes(updateStatus)) {
            throw new Error("Invalid status: " + updateStatus);
        }

        if(!mongoose.isValidObjectId(fromUserId)) {
            throw new Error("Invalid fromUserId: " + fromUserId);
        }

        const loggedInUserId = req.user._id;

        if(loggedInUserId.toString() === fromUserId.toString()) {
            throw new Error("Cannot update connection request for yourself");
        }

        const existingConnection = await Connection.findOne({
            fromUserId,
            toUserId: loggedInUserId,
            status: "interested",
        });

        if(!existingConnection) {
            throw new Error("Connection request not found");
        }

        existingConnection.status = updateStatus;
        const savedConnectionRequest = await existingConnection.save();

        res.json({
            success: true,
            message: updateStatus === "accepted" ?
                    "Connection request accepted successfully!" : 
                    "Connection request rejected successfully!", 
            data: savedConnectionRequest, 
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

module.exports = connectionRouter;