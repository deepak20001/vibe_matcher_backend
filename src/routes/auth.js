const express = require("express");
const User = require("../models/user");
const { ValidateSignUpData } = require("../utils/validation"); 
const bcrypt = require("bcrypt");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
    try{
        /// Validate the request body
        ValidateSignUpData(req);

        const { 
            name, 
            email, 
            password, 
            address, 
            dob,
            gender, 
            selectedInterests, 
            profilePhotos,
        } = req.body;
        
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            throw new Error("User already exists with this email!");
        }

        /// Hash the password
        const passwordHash = await bcrypt.hash(password, 10);
        
        /// Create a new user
        const user = new User({
            name,
            email,
            password: passwordHash,
            address,
            dob,
            gender,
            selectedInterests,
            profilePhotos,
        });

        /// Save the user
        const savedUser = await user.save();

        const accessToken = await savedUser.getJWT();
        
        /// savedUser.toObject() to convert the MongoDB document to a plain object
        const { password: _, ...userWithoutPassword } = savedUser.toObject();

        res.json({ 
            success: true,
            message: "User registered successfully!", 
            data: {
                user: userWithoutPassword,
                accessToken,
            }, 
        });
    } catch(err) {
        console.error({
            code: err.code || 'UNKNOWN_ERROR',
            details: err.stack
        });
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
});

authRouter.post("/login", async (req, res) => {
    try{
        const { email, password } = req.body;
        
        const existingUser = await User.findOne({ email});
        console.log(email);
        console.log(password);
        console.log(existingUser);
        if(!existingUser) {
            throw new Error("Invalid credentials!");
        }

        const isPasswordValid = await existingUser.comparePassword(password);
        if(!isPasswordValid) {
            throw new Error("Invalid credentials!");
        }
        
        /// Generate token
        const accessToken = await existingUser.getJWT();

        const { password: _, ...userWithoutPassword } = existingUser.toObject();

        res.json({ 
            success: true,
            message: "User Logged in successfully!", 
            data:  {
                user: userWithoutPassword,
                accessToken,
            }, 
        });
    } catch(err) {
        console.error({
            code: err.code || 'UNKNOWN_ERROR',
            details: err.stack
        });
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
});


module.exports = authRouter;