"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.editUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = __importDefault(require("../models/user.model"));
const generateToken_1 = require("../utils/generateToken");
const redis_1 = require("../utils/redis");
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser)
            return res
                .status(401)
                .json({ error: "User with this email already exists" });
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        const user = new user_model_1.default({
            username,
            email,
            password: hashedPassword,
        });
        await user.save();
        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                token: (0, generateToken_1.generateToken)(user._id),
            });
        }
        else {
            res.status(401).json({ error: "Can`t register user" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to register a user",
        });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ error: "No registered user with the email" });
        if (user && (await bcrypt_1.default.compare(password, user.password))) {
            const token = (0, generateToken_1.generateToken)(user._id);
            // Cache user data on login
            await redis_1.RedisService.setWithTTL(`user:${user._id}`, JSON.stringify(user));
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token,
            });
        }
        else {
            res.status(401).json({ error: "Incorrect Login or Password" });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to login user",
        });
    }
};
exports.loginUser = loginUser;
const editUser = async (req, res) => {
    try {
        const user = await user_model_1.default.findByIdAndUpdate(req.userId, {
            $set: req.body,
        }, { new: true });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        // Update cache after user edit
        await redis_1.RedisService.setWithTTL(`user:${req.userId}`, JSON.stringify(user));
        res.json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to update user",
        });
    }
};
exports.editUser = editUser;
const getUser = async (req, res) => {
    try {
        // Try to get user from cache first
        const cachedUser = await redis_1.RedisService.get(`user:${req.userId}`);
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            return res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
            });
        }
        // If not in cache, get from database
        const user = await user_model_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        // Cache the user data
        await redis_1.RedisService.setWithTTL(`user:${req.userId}`, JSON.stringify(user));
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get user",
        });
    }
};
exports.getUser = getUser;
