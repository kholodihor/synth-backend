"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const effect_1 = require("effect");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const UploadsController = __importStar(require("./uploads.controller"));
const router = (0, express_1.Router)();
// Configure multer storage for local file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Create directories if they don't exist
        const createDirectoryIfNotExists = (path) => {
            if (!fs_1.default.existsSync(path)) {
                fs_1.default.mkdirSync(path, { recursive: true });
            }
        };
        createDirectoryIfNotExists('uploads');
        if (file.fieldname === 'avatar') {
            createDirectoryIfNotExists('uploads/images/users');
            cb(null, 'uploads/images/users');
        }
        else if (file.fieldname === 'band') {
            createDirectoryIfNotExists('uploads/images/bands');
            cb(null, 'uploads/images/bands');
        }
        else if (file.fieldname === 'song') {
            createDirectoryIfNotExists('uploads/songs');
            cb(null, 'uploads/songs');
        }
        else if (file.fieldname === 'topsong') {
            createDirectoryIfNotExists('uploads/songs/topsongs');
            cb(null, 'uploads/songs/topsongs');
        }
        else {
            cb(new Error(`Unsupported field name: ${file.fieldname}`), '');
        }
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
/**
 * Upload avatar image to Cloudinary
 */
router.post('/uploadavatar', async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({
            success: false,
            message: 'No image provided'
        });
    }
    const program = UploadsController.uploadImage(image, 'users');
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (data) => data,
        onFailure: (error) => {
            console.error('Upload error:', error);
            return { error: error.message };
        }
    }));
    if ('error' in result) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.json({
        success: true,
        url: result.url,
        publicId: result.publicId
    });
});
/**
 * Upload band image to Cloudinary
 */
router.post('/uploadbandimage', async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({
            success: false,
            message: 'No image provided'
        });
    }
    const program = UploadsController.uploadImage(image, 'bands');
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (data) => data,
        onFailure: (error) => {
            console.error('Upload error:', error);
            return { error: error.message };
        }
    }));
    if ('error' in result) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.json({
        success: true,
        url: result.url,
        publicId: result.publicId
    });
});
/**
 * Upload song file to Cloudinary
 */
router.post('/uploadsong', async (req, res) => {
    if (!req.files || !req.files.song) {
        return res.status(400).json({
            success: false,
            message: 'No song file provided'
        });
    }
    const file = req.files.song;
    const program = UploadsController.uploadFile(file, 'music');
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (data) => data,
        onFailure: (error) => {
            console.error('Upload error:', error);
            return { error: error.message };
        }
    }));
    if ('error' in result) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.json({
        success: true,
        url: result.url,
        fileName: result.fileName,
        publicId: result.publicId
    });
});
/**
 * Upload top song file to local storage
 */
router.post('/uploadtopsong', upload.single('topsong'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No song file provided'
        });
    }
    const program = UploadsController.uploadLocalFile(req.file);
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (data) => data,
        onFailure: (error) => {
            console.error('Upload error:', error);
            return { error: error.message };
        }
    }));
    if ('error' in result) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.json({
        success: true,
        url: result.url,
        fileName: result.fileName
    });
});
exports.default = router;
