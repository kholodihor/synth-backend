"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMusic = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("../client");
const redis_1 = require("../../utils/redis");
const ENDPOINTS = {
    withDescribedLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_DESCRIBED_LYRICS,
    fromDescription: process.env.MODAL_ENDPOINT_GENERATE_FROM_DESCRIPTION,
    withLyrics: process.env.MODAL_ENDPOINT_GENERATE_WITH_LYRICS,
    generate: process.env.MODAL_ENDPOINT_GENERATE,
};
exports.generateMusic = client_1.inngest.createFunction({ id: "generate-music" }, { event: "app/generate.music" }, async ({ event, step }) => {
    const { jobId, kind, payload } = event.data;
    const redis = redis_1.RedisService.getInstance();
    const key = `job:${jobId}`;
    try {
        await redis.set(key, JSON.stringify({ status: "processing" }), "EX", 60 * 60);
        const endpoint = ENDPOINTS[kind];
        if (!endpoint) {
            throw new Error(`Modal endpoint not configured for kind=${kind}`);
        }
        const { data } = await step.run("call-modal", async () => {
            return axios_1.default.post(endpoint, payload, { timeout: 15 * 60 * 1000 }).then(r => r.data);
        });
        await redis.set(key, JSON.stringify({ status: "done", result: data }), "EX", 60 * 60);
        return { ok: true };
    }
    catch (error) {
        await redis.set(key, JSON.stringify({ status: "error", error: error?.message ?? "unknown" }), "EX", 60 * 60);
        throw error;
    }
});
