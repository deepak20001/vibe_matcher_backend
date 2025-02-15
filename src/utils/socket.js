const { Server } = require("socket.io");
const Chat = require("../models/chat");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
        },
    });
    
    io.on("connection", (socket) => {
        socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
            console.log(firstName + " joined chat");
            /* const roomId = getSecretRoomId(userId, targetUserId);
            console.log(firstName + " joined Room : " + roomId);
            socket.join(roomId); */
        });

        socket.on(
            "sendMessage",
            async ({ firstName, lastName, userId, targetUserId, text }) => {
              // Save messages to the database
            try {
                console.log(firstName + " " + text);
                /* const roomId = getSecretRoomId(userId, targetUserId);
                console.log(firstName + " " + text);
                // TODO: Check if userId & targetUserId are friends
                let chat = await Chat.findOne({
                participants: { $all: [userId, targetUserId] },
                });
                if (!chat) {
                    chat = new Chat({
                    participants: [userId, targetUserId],
                    messages: [],
                    });
                }
                chat.messages.push({
                senderId: userId,
                text,
                });
                await chat.save();
                io.to(roomId).emit("messageReceived", { firstName, lastName, text }); */
            } catch (err) {
            console.log(err);
            }
            }
        );
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });
};