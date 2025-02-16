const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const Connection = require("../models/connection");
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

        // Rename `fromUserId` to `fromUserData` in the response
        const formattedConnections = connections.map(connection => ({
            ...connection._doc,
            fromUserData: connection.fromUserId,
            fromUserId: undefined, // Remove the old field
            toUserData: connection.toUserId,
            toUserId: undefined, // Remove the old field
        }));

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