"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBandValidation = void 0;
const bandSchema_1 = require("./bandSchema");
const validator_1 = __importDefault(require("../validator"));
const createBandValidation = (req, res, next) => {
    (0, validator_1.default)(bandSchema_1.bandSchema.createBand, req.body, next);
};
exports.createBandValidation = createBandValidation;
