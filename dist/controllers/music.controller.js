"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithDescribedLyrics = generateWithDescribedLyrics;
exports.generateFromDescription = generateFromDescription;
exports.generateWithLyrics = generateWithLyrics;
exports.generateTest = generateTest;
const axios_1 = __importDefault(require("axios"));
const ENDPOINTS = {
    withDescribedLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_DESCRIBED_LYRICS,
    fromDescription: process.env.MODAL_ENDPOINT_GENERATE_FROM_DESCRIPTION,
    withLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_LYRICS,
    generate: process.env.MODAL_ENDPOINT_GENERATE,
};
const AXIOS_OPTS = { timeout: 15 * 60 * 1000 }; // 15 minutes
async function generateWithDescribedLyrics(req, res) {
    try {
        if (!ENDPOINTS.withDescribedLyrics) {
            return res.status(500).json({ error: "Modal endpoint not configured" });
        }
        const { data } = await axios_1.default.post(ENDPOINTS.withDescribedLyrics, req.body, AXIOS_OPTS);
        return res.json(data);
    }
    catch (err) {
        const status = err.response?.status || 500;
        return res.status(status).json({ error: err.message, details: err.response?.data });
    }
}
async function generateFromDescription(req, res) {
    try {
        if (!ENDPOINTS.fromDescription) {
            return res.status(500).json({ error: "Modal endpoint not configured" });
        }
        const { data } = await axios_1.default.post(ENDPOINTS.fromDescription, req.body, AXIOS_OPTS);
        return res.json(data);
    }
    catch (err) {
        const status = err.response?.status || 500;
        return res.status(status).json({ error: err.message, details: err.response?.data });
    }
}
async function generateWithLyrics(req, res) {
    try {
        if (!ENDPOINTS.withLyrics) {
            return res.status(500).json({ error: "Modal endpoint not configured" });
        }
        const { data } = await axios_1.default.post(ENDPOINTS.withLyrics, req.body, AXIOS_OPTS);
        return res.json(data);
    }
    catch (err) {
        const status = err.response?.status || 500;
        return res.status(status).json({ error: err.message, details: err.response?.data });
    }
}
async function generateTest(req, res) {
    try {
        if (!ENDPOINTS.generate) {
            return res.status(500).json({ error: "Modal endpoint not configured" });
        }
        const { data } = await axios_1.default.post(ENDPOINTS.generate, {}, AXIOS_OPTS);
        return res.json(data);
    }
    catch (err) {
        const status = err.response?.status || 500;
        return res.status(status).json({ error: err.message, details: err.response?.data });
    }
}
