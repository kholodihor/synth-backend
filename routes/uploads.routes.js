"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../libs/cloudinary"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (!fs_1.default.existsSync('uploads')) {
            fs_1.default.mkdirSync('uploads');
        }
        if (file.fieldname === 'avatar') {
            cb(null, 'uploads/images/users');
        }
        else if (file.fieldname === 'band') {
            cb(null, 'uploads/images/bands');
        }
        else if (file.fieldname === 'song') {
            cb(null, 'uploads/songs');
        }
        else if (file.fieldname === 'topsong') {
            cb(null, 'uploads/songs/topsongs');
        }
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
router.post('/uploadavatar', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { image } = req.body;
    try {
        const result = yield cloudinary_1.default.uploader.upload(image, {
            folder: 'users',
        });
        res.json({
            url: result.secure_url,
        });
    }
    catch (error) {
        console.error(error);
    }
}));
router.post('/uploadbandimage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { image } = req.body;
    try {
        const result = yield cloudinary_1.default.uploader.upload(image, {
            folder: 'bands',
        });
        res.json({
            url: result.secure_url,
        });
    }
    catch (error) {
        console.error(error);
    }
}));
router.post('/uploadsong', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const file = (_a = req === null || req === void 0 ? void 0 : req.files) === null || _a === void 0 ? void 0 : _a.song;
    try {
        //@ts-ignore
        const result = yield cloudinary_1.default.uploader.upload(file.tempFilePath, {
            folder: 'music',
            resource_type: 'auto',
        });
        res.json({
            url: result.secure_url,
        });
    }
    catch (error) {
        console.error(error);
    }
}));
router.post('/uploadtopsong', upload.single('topsong'), (req, res) => {
    var _a, _b;
    res.json({
        url: `/uploads/songs/topsongs/${(_a = req === null || req === void 0 ? void 0 : req.file) === null || _a === void 0 ? void 0 : _a.originalname}`,
        fileName: (_b = req === null || req === void 0 ? void 0 : req.file) === null || _b === void 0 ? void 0 : _b.originalname,
    });
});
exports.default = router;
