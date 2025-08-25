"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addVideoValidation = void 0;
const videoSchema_1 = require("./videoSchema");
const validator_1 = __importDefault(require("../validator"));
const addVideoValidation = (req, res, next) => {
    (0, validator_1.default)(videoSchema_1.videoSchema.addVideo, req.body, next);
};
exports.addVideoValidation = addVideoValidation;
