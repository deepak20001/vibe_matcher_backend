const express = require("express");
const User = require("../models/user");
const Connection = require("../models/connection");
const userAuth = require("../middlewares/userAuth");

const feedRouter = express.Router();

feedRouter.get("/", userAuth, async (req, res) => {
    try {
        /// Fetch all connection requests where fromUserId or toUserId is the logged in user
        const connectionRequests = Connection.find({
            $or: [
                {
                    fromUserId: req.user._id,
                },
                {
                    toUserId: req.user._id,
                }
            ],
        }).select("fromUserId toUserId");
        
        /// Hide users from feed whose connection request is already updated in the Connection model
        const hideFromFeed = new Set();
        (await connectionRequests).forEach((connectionRequest) => {
            if(req.user._id.toString() != connectionRequest.fromUserId.toString()) {
                hideFromFeed.add(connectionRequest.fromUserId);
            } else {
                hideFromFeed.add(connectionRequest.toUserId);
            }
        });

        const users = await User.find({
            _id: { $nin: [...hideFromFeed, req.user._id] },
        }, "name profilePhotos selectedInterests");

        return res.json({
            success: true,
            data: users,
        });
    } catch (err) {
        console.error({
            code: err.code || "UNKNOWN_ERROR",
            details: err.stack,
        });
        return res.status(400).json({
            success: false,
            message: "Failed to fetch feed",
        });
    }
});

module.exports = feedRouter;