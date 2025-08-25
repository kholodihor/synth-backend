"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadTopSong = exports.uploadSong = exports.uploadBandImage = exports.uploadAvatar = exports.UploadError = void 0;
const effect_1 = require("effect");
const cloudinary_1 = __importDefault(require("../libs/cloudinary"));
// Error types
class UploadError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'UploadError';
    }
}
exports.UploadError = UploadError;
/**
 * Upload an image to Cloudinary
 */
const uploadImageToCloudinary = (image, folder) => {
    return effect_1.Effect.tryPromise({
        try: async () => {
            const result = await cloudinary_1.default.uploader.upload(image, {
                folder,
            });
            return {
                url: result.secure_url,
                publicId: result.public_id
            };
        },
        catch: (error) => new UploadError(`Failed to upload image to ${folder}: ${error}`)
    });
};
/**
 * Upload a file to Cloudinary
 */
const uploadFileToCloudinary = (file, folder) => {
    return effect_1.Effect.tryPromise({
        try: async () => {
            const result = await cloudinary_1.default.uploader.upload(file.tempFilePath, {
                folder,
                resource_type: 'auto',
            });
            return {
                url: result.secure_url,
                fileName: file.name,
                publicId: result.public_id
            };
        },
        catch: (error) => new UploadError(`Failed to upload file to ${folder}: ${error}`)
    });
};
/**
 * Process a local file upload
 */
const processLocalFile = (file) => {
    return effect_1.Effect.try({
        try: () => {
            if (!file) {
                throw new UploadError('No file provided');
            }
            return {
                url: `/uploads/songs/topsongs/${file.originalname}`,
                fileName: file.originalname
            };
        },
        catch: (error) => new UploadError(`Failed to process local file: ${error}`)
    });
};
/**
 * Upload avatar image
 */
const uploadAvatar = async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({
            success: false,
            message: 'No image provided'
        });
    }
    try {
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(uploadImageToCloudinary(image, 'users'), {
            onSuccess: (data) => ({ success: true, data }),
            onFailure: (error) => {
                console.error('Upload error:', error);
                return { success: false, error: error.message };
            }
        }));
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
        res.json({
            success: true,
            url: result.data.url,
            publicId: result.data.publicId
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload avatar'
        });
    }
};
exports.uploadAvatar = uploadAvatar;
/**
 * Upload band image
 */
const uploadBandImage = async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({
            success: false,
            message: 'No image provided'
        });
    }
    try {
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(uploadImageToCloudinary(image, 'bands'), {
            onSuccess: (data) => ({ success: true, data }),
            onFailure: (error) => {
                console.error('Upload error:', error);
                return { success: false, error: error.message };
            }
        }));
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
        res.json({
            success: true,
            url: result.data.url,
            publicId: result.data.publicId
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload band image'
        });
    }
};
exports.uploadBandImage = uploadBandImage;
/**
 * Upload song file
 */
const uploadSong = async (req, res) => {
    if (!req.files || !req.files.song) {
        return res.status(400).json({
            success: false,
            message: 'No song file provided'
        });
    }
    try {
        const file = req.files.song;
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(uploadFileToCloudinary(file, 'music'), {
            onSuccess: (data) => ({ success: true, data }),
            onFailure: (error) => {
                console.error('Upload error:', error);
                return { success: false, error: error.message };
            }
        }));
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
        res.json({
            success: true,
            url: result.data.url,
            fileName: result.data.fileName,
            publicId: result.data.publicId
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload song'
        });
    }
};
exports.uploadSong = uploadSong;
/**
 * Upload top song file (local storage)
 */
const uploadTopSong = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No song file provided'
        });
    }
    try {
        const result = effect_1.Effect.runSync(effect_1.Effect.match(processLocalFile(req.file), {
            onSuccess: (data) => ({ success: true, data }),
            onFailure: (error) => {
                console.error('File processing error:', error);
                return { success: false, error: error.message };
            }
        }));
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
        res.json({
            success: true,
            url: result.data.url,
            fileName: result.data.fileName
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to process top song'
        });
    }
};
exports.uploadTopSong = uploadTopSong;
