const cloudinary = require('cloudinary');
const fs = require('fs');

// Configure Cloudinary with credentials from environment variables
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Function to upload a file to Cloudinary
const uploadFileToCloudinary = async (localFilePath) => {
    try {
        // Ensure the file path is provided, return null if not
        if(!localFilePath) {
            throw new Error("Local File Path not provided");
        }
        const uploadedFile = await cloudinary.v2.uploader.upload(localFilePath, {
            folder: 'vibe_matcher',
            resource_type: "auto",
        });
        return uploadedFile;
    } catch(err) {
        console.error({
            code: err.code || 'CLOUDINARY_UPLOAD_ERROR',
            details: err.stack,
        });
        throw new Error("Error uploading file to Cloudinary");
    } finally {
        // Ensure the local file is deleted in all cases
        try {
            await fs.promises.unlink(localFilePath);
            console.log("Local file deleted:", localFilePath);
        } catch (unlinkError) {
            console.error("Error deleting local file:", unlinkError);
            throw new Error(unlinkError);
        }
    }
}

module.exports = uploadFileToCloudinary;