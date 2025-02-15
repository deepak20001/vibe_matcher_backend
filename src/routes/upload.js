const express = require("express");
const multer = require("multer");
const uploadFileToCloudinary = require("../utils/cloudinary");
const sharp = require('sharp');
const uploadRouter = express.Router();

/// Multer disk storage
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

/// Process image using sharp
const processImage = async(filePath) => {
    try {
        const processedImageBuffer = await sharp(filePath)
            .resize(1080, 1080, {
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();

        return processedImageBuffer;
    } catch (error) {
        console.error('Image processing error:', error);
        throw new Error('Failed to process image');
    }
}

/// Upload file to disk
const upload = multer({ storage: storage });

/// Multer adds the req.file object to the request
uploadRouter.post("/single", upload.single('image'), async (req, res) => {
    try {
        /// check if file not empty
        if (!req.file) {
            throw new Error("Please upload a file");
        }

        // Process image before upload
        const processedImage = await processImage(req.file.path);
        
        // Write processed image back to file
        await sharp(processedImage).toFile(req.file.path);

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

        // Process each image
        const processPromises = req.files.map(async (file) => {
            const processedImage = await processImage(file.path);
            await sharp(processedImage).toFile(file.path);
            return file.path;
        });

        const processedPaths = await Promise.all(processPromises);

        const uploadPromises = processedPaths.map((path) => uploadFileToCloudinary(path));
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