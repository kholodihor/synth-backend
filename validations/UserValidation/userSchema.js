"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.userSchema = {
    registerUser: joi_1.default.object({
        username: joi_1.default.string()
            .min(3)
            .max(30)
            .pattern(/^[a-zA-Z0-9_-]+$/)
            .required()
            .messages({
            'string.pattern.base': 'Username can only contain letters, numbers, underscores and dashes',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters'
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address'
        }),
        password: joi_1.default.string()
            .min(6)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
            .required()
            .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            'string.min': 'Password must be at least 6 characters long'
        })
    }),
    loginUser: joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address'
        }),
        password: joi_1.default.string()
            .required()
            .messages({
            'string.empty': 'Password is required'
        })
    }),
    editUser: joi_1.default.object({
        username: joi_1.default.string()
            .min(3)
            .max(30)
            .pattern(/^[a-zA-Z0-9_-]+$/)
            .messages({
            'string.pattern.base': 'Username can only contain letters, numbers, underscores and dashes',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters'
        }),
        avatarUrl: joi_1.default.string()
            .allow('')
            .pattern(/\.(jpg|jpeg|png|gif)$/i)
            .messages({
            'string.pattern.base': 'Avatar URL must end with a valid image extension (.jpg, .jpeg, .png, or .gif)'
        })
    })
};
