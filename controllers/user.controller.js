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
exports.getUser = exports.editUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = __importDefault(require("../models/user.model"));
const generateToken_1 = require("../utils/generateToken");
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    try {
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser)
            return res
                .status(401)
                .json({ error: "User with this email already exists" });
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        const user = new user_model_1.default({
            username,
            email,
            password: hashedPassword,
        });
        yield user.save();
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
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield user_model_1.default.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ error: "No registered user with the email" });
        if (user && (yield bcrypt_1.default.compare(password, user.password))) {
            const token = (0, generateToken_1.generateToken)(user._id);
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token,
            });
        }
        else {
            res.status(401).json({ error: "Incorrect Login or Pasword" });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Fail to login a user",
        });
    }
});
exports.loginUser = loginUser;
const editUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, avatarUrl } = req.body;
        yield user_model_1.default.findOneAndUpdate({ _id: req.userId }, {
            username,
            avatarUrl,
        });
        res.status(200).json({ message: `User ${username} Updated` });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to edit a user",
        });
    }
});
exports.editUser = editUser;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
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
            message: "Fail to get a user",
        });
    }
});
exports.getUser = getUser;
