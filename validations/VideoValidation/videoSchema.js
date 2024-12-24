"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.videoSchema = {
    addVideo: joi_1.default.object({
        title: joi_1.default.string()
            .min(1)
            .max(100)
            .required()
            .messages({
            'string.min': 'Video title must not be empty',
            'string.max': 'Video title cannot exceed 100 characters',
            'string.empty': 'Video title is required'
        }),
        url: joi_1.default.string()
            .required()
            .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
            .messages({
            'string.empty': 'Video URL is required',
            'string.pattern.base': 'Please provide a valid YouTube video URL'
        })
    })
};
