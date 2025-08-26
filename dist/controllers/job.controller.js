"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobStatus = exports.enqueueGenerate = void 0;
const client_1 = require("../inngest/client");
const redis_1 = require("../utils/redis");
const crypto_1 = require("crypto");
const enqueueGenerate = async (req, res) => {
    try {
        const { kind, payload } = req.body;
        if (!kind) {
            return res.status(400).json({ error: "Missing kind" });
        }
        const jobId = (0, crypto_1.randomUUID)();
        await client_1.inngest.send({
            name: "app/generate.music",
            data: {
                jobId,
                kind,
                payload: payload ?? {},
                // @ts-ignore optional user id if middleware injected
                userId: req.userId,
            },
        });
        // Initialize job status in Redis to pending
        const redis = redis_1.RedisService.getInstance();
        await redis.set(`job:${jobId}`, JSON.stringify({ status: "pending" }), "EX", 60 * 60);
        return res.status(202).json({ jobId });
    }
    catch (err) {
        return res.status(500).json({ error: err?.message || "Failed to enqueue" });
    }
};
exports.enqueueGenerate = enqueueGenerate;
const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: "Missing jobId" });
        }
        const redis = redis_1.RedisService.getInstance();
        const raw = await redis.get(`job:${jobId}`);
        if (!raw) {
            return res.status(404).json({ error: "Job not found" });
        }
        return res.json(JSON.parse(raw));
    }
    catch (err) {
        return res.status(500).json({ error: err?.message || "Failed to read status" });
    }
};
exports.getJobStatus = getJobStatus;
