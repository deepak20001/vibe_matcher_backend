const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const Connection = require("../models/connection");
const userAuth = require("../middlewares/userAuth");

const connectionRouter = express.Router();

connectionRouter.post("/send/:updateStatus/:toUserId", userAuth,  async (req, res) => {
    try {
        const { updateStatus, toUserId } = req.params;
        const loggedInUserId = req.user._id;

        if(!updateStatus || !toUserId) {
            throw new Error(((!updateStatus) ? "updateStatus" : "toUserId") + " is required");
        }

        const allowedStatus = ["interested", "ignored"];
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

module.exports = connectionRouter;