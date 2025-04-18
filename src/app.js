require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const http = require("http");

const app = express();
app.use(express.json());

const authRouter = require("./routes/auth"); 
const uploadRouter = require("./routes/upload");
const feedRouter = require("./routes/feed");
const connectionRouter = require("./routes/connection");
const profileRouter = require("./routes/profile");
const chatRouter = require("./routes/chat");
const initializeSocket = require("./utils/socket");

// Mount the router
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use("/feed", feedRouter);
app.use("/connection", connectionRouter);
app.use("/profile", profileRouter);
app.use("/chat", chatRouter);

const server = http.createServer(app);
initializeSocket(server);

connectDB().then(() => {
    console.log("DB connection established::::::::::::::::::::::");
    server.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}::::::::::::::::::::`);
    });
}).catch((err) => {
    console.error(err);
});