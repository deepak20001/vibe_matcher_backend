const socket = require("socket.io");
const Chat = require("../models/chat");
const Connection = require("../models/connection");
const mongoose = require("mongoose");

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: "*",
        },
    });

    io.on("connection", (socket) => {
    console.log('Socket connected::::::::::::::::::::::' , socket.id);

    // Track online users
    const onlineUsers = new Map();
    // Handle user coming online
    socket.on("userOnline", (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit("userStatusChanged", {
            userId: userId,
            isOnline: true
        });
        // Send current online users to newly connected user
        socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("joinRoom", async ({ userId, receiverId }) => {
        try {
            const room = [userId, receiverId].sort().join("_");
            socket.join(room);
            console.log('joinRoom-triggered::::::::::::::::::::::' , room);
        } catch (error) {
            socket.emit("error", {
                message: "Failed to join room",
                error: error.message
            });
        }
    });

    socket.on("sendMessage", async ({ userId, receiverId, text }) => {
        try {
            console.log('sendMessage-triggered::::::::::::::::::::::' , text, userId, receiverId);
            const room = [userId, receiverId].sort().join("_");
    
            const connection = await Connection.findOne({ 
                $or: [
                    { fromUserId: userId, toUserId: receiverId },
                    { fromUserId: receiverId, toUserId: userId }
                ],
                status: "accepted"
            });
    
            if(!connection) {
                throw new Error("Connection not found");
            }
            
            // Find or create chat
            let chat = await Chat.findOne({ participants: { $all: [userId, receiverId] } });
            if(!chat) {
                chat = new Chat({ 
                    participants: [userId, receiverId],
                    messages: [],
                });
            }

            // Add new message
            chat.messages.push({ senderId: userId, text: text, isRead: false });
            const savedChat = await chat.save();

            const savedMessageId = savedChat.messages[savedChat.messages.length - 1]._id;
            console.log('savedMessageId::::::::::::::::::::::' , savedMessageId);

            // Emit to room
            io.to(room).emit("receiveMessage", {
                senderId: userId,
                text,
                _id: savedMessageId,
            });
        } catch (error) {
            console.log('error::::::::::::::::::::::' ,error);
            // Emit error to sender only
            socket.emit("error", {
                message: "Failed to send message",
                error: error.message
            });
        }
    });

    socket.on("disconnect", async ({ room, message }) => {
        console.log('Socket disconnected::::::::::::::::::::::');
         // Find and remove disconnected user
        let disconnectedUserId;
        onlineUsers.forEach((socketId, userId) => {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
            }
        });

        if (disconnectedUserId) {
            onlineUsers.delete(disconnectedUserId);
            io.emit("userStatusChanged", {
                userId: disconnectedUserId,
                isOnline: false
            });
        }

        /*   const newMessage = new Chat({ room, message });
        await newMessage.save();
        io.to(room).emit("message", [newMessage]); */
    });
    
}); 
};

module.exports = initializeSocket;