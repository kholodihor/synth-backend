"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.songSchema = {
    addSong: joi_1.default.object({
        title: joi_1.default.string()
            .min(1)
            .max(100)
            .required()
            .messages({
            'string.min': 'Song title must not be empty',
            'string.max': 'Song title cannot exceed 100 characters',
            'string.empty': 'Song title is required'
        }),
        artist: joi_1.default.string()
            .min(1)
            .max(100)
            .required()
            .messages({
            'string.min': 'Artist name must not be empty',
            'string.max': 'Artist name cannot exceed 100 characters',
            'string.empty': 'Artist name is required'
        }),
        song: joi_1.default.string()
            .required()
            .pattern(/\.(mp3|wav|ogg|m4a)$/i)
            .messages({
            'string.empty': 'Song file is required',
            'string.pattern.base': 'Song file must be a valid audio format (.mp3, .wav, .ogg, or .m4a)'
        })
    })
};
