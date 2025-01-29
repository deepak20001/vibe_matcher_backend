const express = require("express");
const multer = require("multer");
const uploadFileToCloudinary = require("../utils/cloudinary");
const uploadRouter = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalFileName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${uniqueSuffix}-${originalFileName}`);
    }
    
});

/// Upload file to disk
const upload = multer({ storage: storage });

/// Multer adds the req.file object to the request
uploadRouter.post("/single", upload.single('image'), async (req, res) => {
    try {
        /// check if file not empty
        if (!req.file) {
            throw new Error("Please upload a file");
        }

        const uploadedFile = await uploadFileToCloudinary(req.file.path);

        res.json({
            success: true,
            message: "File uploaded successfully",
            data: uploadedFile.url,
        });
    } catch (err) {
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

uploadRouter.post("/multiple", upload.array('images', 3), async (req, res) => {
    try {
        if(!req.files || req.files.length === 0) {
            throw new Error("Please upload at least one image");
        }

        const uploadPromises = req.files.map((file) => uploadFileToCloudinary(file.path));
        const uploadedFiles = await Promise.all(uploadPromises);

        res.json({
            success: true,
            message: "File uploaded successfully",
            data: uploadedFiles.map(result => result.url),
        });
    } catch (err) {
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

module.exports = uploadRouter;