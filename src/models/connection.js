const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
    {
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: {
                values: ["interested", "accepted", "rejected"],
                message: "{VALUE} is not supported",
            },
        }
    }, 
    {
        timestamps: true,
    }
);

/// validate that fromUserId and toUserId are not same before saving
connectionSchema.pre("save", function(next) {
    const connectionRequest = this;
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        throw new Error("Cannot send connection request to yourself");
    }
    next();
});

module.exports = mongoose.model("Connection", connectionSchema);