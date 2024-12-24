"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editUserValidation = exports.loginUserValidation = exports.registerUserValidation = void 0;
const userSchema_1 = require("./userSchema");
const validator_1 = __importDefault(require("../validator"));
const registerUserValidation = (req, res, next) => {
    (0, validator_1.default)(userSchema_1.userSchema.registerUser, req.body, next);
};
exports.registerUserValidation = registerUserValidation;
const loginUserValidation = (req, res, next) => {
    (0, validator_1.default)(userSchema_1.userSchema.loginUser, req.body, next);
};
exports.loginUserValidation = loginUserValidation;
const editUserValidation = (req, res, next) => {
    (0, validator_1.default)(userSchema_1.userSchema.editUser, req.body, next);
};
exports.editUserValidation = editUserValidation;
