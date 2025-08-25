"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSongValidation = void 0;
const songSchema_1 = require("./songSchema");
const validator_1 = __importDefault(require("../validator"));
const addSongValidation = (req, res, next) => {
    (0, validator_1.default)(songSchema_1.songSchema.addSong, req.body, next);
};
exports.addSongValidation = addSongValidation;
