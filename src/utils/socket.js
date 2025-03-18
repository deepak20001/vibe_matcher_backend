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

    // Track online users with Map (userId -> socketId)
    const onlineUsers = new Map();

    io.on("connection", (socket) => {
    console.log('Socket connected::::::::::::::::::::::' , socket.id);

    
    // Handle user coming online
    socket.on("userOnline", ( data ) => {
        console.log('userOnline-triggered::::::::::::::::::::::' , data);
        const userIdStr = data.userId?.toString();

        if (!userIdStr) {
            console.error('Invalid userId received:', data);
            return;
        }

        // Remove any existing entries for this userId
        for (const [key, value] of onlineUsers.entries()) {
            if (key === userIdStr) {
                onlineUsers.delete(key);
            }
        }

        onlineUsers.set(userIdStr, socket.id);

        console.log('Online Users:', Array.from(onlineUsers.entries()));
        console.log('onlineUsers::::::::::::::::::::::' , onlineUsers);

        // Emit to all clients
        io.emit("usersOnline", Array.from(onlineUsers.keys()));

        // Send current online users to newly connected user
        // socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
    
    /// room where chat is happening
    socket.on("joinChatRoom", async ({ userId, receiverId }) => {
        try {
            const room = [userId, receiverId].sort().join("_");
            socket.join(room);
            console.log('joinChatRoom-triggered::::::::::::::::::::::' , room);
        } catch (error) {
            socket.emit("error", {
                message: "Failed to join room",
                error: error.message
            });
        }
    });
    
    /// room to listen to last message updates for receiver only
    socket.on("joinReceiverRoom", async ({ receiverId }) => {
        try {
            socket.join(receiverId);
            console.log('joinReceiverRoom-triggered::::::::::::::::::::::' , receiverId);
        } catch (error) {
            socket.emit("error", {
                message: "Failed to join room",
                error: error.message
            });
        }
    });
    
    /// send message to room
    socket.on("sendMessage", async ({ userId, receiverId, text }) => {
        try {
            console.log('sendMessage-triggered::::::::::::::::::::::' , text, userId, receiverId);
            const room = [userId, receiverId].sort().join("_");
            console.log('room::::::::::::::::::::::' , room);
    
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
            const savedMessage = savedChat.messages[savedChat.messages.length - 1];
            const savedMessageId = savedChat.messages[savedChat.messages.length - 1]._id;
            console.log('savedMessageId::::::::::::::::::::::' , savedMessageId);

            console.log('Emitting to room:', room);
            // Emit to room for chat window
            /* io.to(room).emit("receiveMessage", {
                senderId: userId,
                text,
                _id: savedMessageId,
            }); */

            // Emit last message update for chat list
            io.to(receiverId).emit("lastMessageUpdated", {
                chatId : savedChat._id,
                message: {
                    _id: savedMessage?._id,
                    senderId: userId,
                    text: text,
                    createdAt: savedMessage?.createdAt ?? new Date(),
                    isRead: false
                },
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
    
    /// leave room
    socket.on("leaveRoom", async({ roomId }) => {
        try {

            socket.leave(roomId);
            console.log('leaveRoom-triggered::::::::::::::::::::::' , roomId);
        } catch (error) {
            console.log('error::::::::::::::::::::::' ,error);
            // Emit error to sender only
            socket.emit("error", {
                message: "Failed to leave room",
                error: error.message
            });
        }
    })
    
    /// disconnect socket
    socket.on("disconnect", async ({ room, message }) => {
        console.log('Socket disconnected:', socket.id);
            
            // Find and remove disconnected user
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    
                    break;
                }
            }
            io.emit("usersOnline", Array.from(onlineUsers.keys()));
            console.log('onlineUsers::::::::::::::::::::::' , onlineUsers);
    });
    
}); 
};

module.exports = initializeSocket;