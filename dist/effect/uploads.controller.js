"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLocalFile = exports.uploadFile = exports.uploadImage = exports.UploadError = void 0;
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
const uploadImage = (image, folder) => {
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
        catch: (error) => new UploadError(`Failed to upload image to ${folder}`, error)
    });
};
exports.uploadImage = uploadImage;
/**
 * Upload a file to Cloudinary
 */
const uploadFile = (file, folder) => {
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
        catch: (error) => new UploadError(`Failed to upload file to ${folder}`, error)
    });
};
exports.uploadFile = uploadFile;
/**
 * Upload a file to local storage
 */
const uploadLocalFile = (file) => {
    return effect_1.Effect.try({
        try: () => {
            if (!file) {
                throw new Error('No file provided');
            }
            return {
                url: `/uploads/songs/topsongs/${file.originalname}`,
                fileName: file.originalname
            };
        },
        catch: (error) => new UploadError('Failed to process local file upload', error)
    });
};
exports.uploadLocalFile = uploadLocalFile;
