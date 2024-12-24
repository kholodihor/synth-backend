"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bandSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.bandSchema = {
    createBand: joi_1.default.object({
        title: joi_1.default.string()
            .min(2)
            .max(100)
            .required()
            .messages({
            'string.min': 'Band title must be at least 2 characters long',
            'string.max': 'Band title cannot exceed 100 characters',
            'string.empty': 'Band title is required'
        }),
        description: joi_1.default.string()
            .max(1000)
            .allow('')
            .messages({
            'string.max': 'Description cannot exceed 1000 characters'
        }),
        location: joi_1.default.string()
            .max(100)
            .allow('')
            .messages({
            'string.max': 'Location cannot exceed 100 characters'
        }),
        image: joi_1.default.string()
            .allow('')
            .pattern(/\.(jpg|jpeg|png|gif)$/i)
            .messages({
            'string.pattern.base': 'Image URL must end with a valid image extension (.jpg, .jpeg, .png, or .gif)'
        })
    })
};
