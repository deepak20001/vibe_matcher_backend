const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 20,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid email: " + value);
            }
        }
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum: {
            values: ["Male", "Female", "Other"],
            message: `{VALUE} is not supported`,
        },
    },
    selectedInterests: {
        type: [String],
        required: true,
        validate(value) {
            if(value.length < 3) {
                throw new Error("Please select at least 3 interests");
            }
        }
    },
    profilePhotos: {
        type: [String],
        required: true,
        validate(value) {
            if(value.length != 3) {
                throw new Error("Please upload all 3 photos");
                }
            }
        },
    }, 
    {
        timestamps: true,
    },
);

/// Generate JWT token
userSchema.methods.getJWT = async function() {
    const user = this;

    const token = await jwt.sign(
        { _id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );

    return token;
}

/// Compare password with hashed password
userSchema.methods.comparePassword = async function(password) {
    const user = this;
    const passwordHash = user.password;

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    return isPasswordValid;
}

module.exports = mongoose.model("User", userSchema);