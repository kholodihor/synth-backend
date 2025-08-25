"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideo = exports.getAllVideos = exports.getVideosByUser = exports.addVideo = void 0;
const video_model_1 = __importDefault(require("../models/video.model"));
const redis_1 = require("../utils/redis");
const addVideo = async (req, res, next) => {
    try {
        const { title, url } = req.body;
        const newVideo = new video_model_1.default({
            title,
            url,
            user: req.userId,
        });
        await newVideo.save();
        // Invalidate caches
        await Promise.all([
            redis_1.RedisService.delete("videos:all"),
            redis_1.RedisService.delete(`user:${req.userId}:videos`),
        ]);
        res.status(200).json(newVideo);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to add a video",
        });
    }
};
exports.addVideo = addVideo;
const getVideosByUser = async (req, res, next) => {
    try {
        const cacheKey = `user:${req.userId}:videos`;
        const cachedVideos = await redis_1.RedisService.get(cacheKey);
        if (cachedVideos) {
            return res.json(JSON.parse(cachedVideos));
        }
        const videos = await video_model_1.default.find({ user: req.userId }).sort({
            createdAt: "desc",
        });
        // Cache for 5 minutes
        await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);
        res.json(videos);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to get videos by user",
        });
    }
};
exports.getVideosByUser = getVideosByUser;
const getAllVideos = async (req, res, next) => {
    try {
        const cacheKey = "videos:all";
        const cachedVideos = await redis_1.RedisService.get(cacheKey);
        if (cachedVideos) {
            return res.json(JSON.parse(cachedVideos));
        }
        const videos = await video_model_1.default.find().sort({ createdAt: "desc" });
        // Cache for 5 minutes
        await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);
        return res.json(videos);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to get videos",
        });
    }
};
exports.getAllVideos = getAllVideos;
const deleteVideo = async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await video_model_1.default.findByIdAndDelete(videoId);
        if (!video) {
            return res.status(404).json({
                message: "Video not found",
            });
        }
        // Invalidate caches
        await Promise.all([
            redis_1.RedisService.delete("videos:all"),
            redis_1.RedisService.delete(`user:${req.userId}:videos`),
        ]);
        res.status(200).json("Video deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to delete videos",
        });
    }
};
exports.deleteVideo = deleteVideo;
