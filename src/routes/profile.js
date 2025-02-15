const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { ValidateUpdateProfileData } = require("../utils/validation"); 
const User = require("../models/user");

const profileRouter = express.Router();

profileRouter.get("/", userAuth, async (req, res) => {
    const user = req.user;
    try {
        if(user == null) {
            throw new Error("User not found");
        }

        return res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                address: user.address,
                dob: user.dob,
                gender: user.gender,
                profilePhotos: user.profilePhotos,
            },
        });
    } catch (err) {
        console.error({
            code: err.code || 'UNKNOWN_ERROR',
            details: err.stack
        });
        return res.status(400).json({
            success: false,
            message: "Failed to fetch user profile",
        });
    }
});

profileRouter.patch("/", userAuth, async (req, res) => {
    try {
        const { dob } = req.body;
        console.log(dob);

        /// Validate the request body
        ValidateUpdateProfileData(req);
        const { 
            name, 
            address, 
            // dob, 
            gender, 
            profilePhotos,
        } = req.body;

        const existingUser = await User.findOne({ _id: req.user?.id });
        if(!existingUser) {
            throw new Error("User not found");
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            {
                "name": name,
                "address": address,
                "dob": dob,
                "gender": gender,
                "profilePhotos": profilePhotos,
            },
            {
                new: true,  // Return the modified document rather than the original
                runValidators: true,  // Run validators for update
            },
        ).select("-password -selectedInterests");

        return res.json({
            success: true,
            data: updatedUser,
        });
    } catch (err) {
        console.error({
            code: err.code || 'UNKNOWN_ERROR',
            details: err.stack
        });
        return res.status(400).json({
            success: false,
            message: "Failed to update user profile. " + err.message,
        });
    }
});

module.exports = profileRouter;