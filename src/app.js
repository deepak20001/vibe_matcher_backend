require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const http = require("http");

const app = express();
app.use(express.json());

const server = http.createServer(app);

connectDB().then(() => {
    console.log("DB connection established::::::::::::::::::::::");
    server.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}::::::::::::::::::::`);
    });
}).catch((err) => {
    console.error(err);
});