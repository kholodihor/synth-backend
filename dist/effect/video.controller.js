"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideo = exports.getAllVideos = exports.getVideosByUser = exports.addVideo = exports.VideoNotFoundError = exports.VideoError = void 0;
const effect_1 = require("effect");
const video_model_1 = __importDefault(require("../models/video.model"));
const redis_1 = require("../utils/redis");
/**
 * Effect-based controller for video operations
 * This controller uses Effect for error handling and functional composition
 * while maintaining compatibility with the existing model
 */
// Error types
class VideoError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'VideoError';
    }
}
exports.VideoError = VideoError;
class VideoNotFoundError extends VideoError {
    constructor(id) {
        super(`Video with id ${id} not found`);
        this.name = 'VideoNotFoundError';
    }
}
exports.VideoNotFoundError = VideoNotFoundError;
/**
 * Add a new video
 */
const addVideo = async (req, res) => {
    const { title, url } = req.body;
    const program = effect_1.Effect.tryPromise({
        try: async () => {
            const video = new video_model_1.default({
                title,
                url,
                user: req.userId,
            });
            await video.save();
            // Invalidate caches
            await Promise.all([
                redis_1.RedisService.delete("videos:all"),
                redis_1.RedisService.delete(`user:${req.userId}:videos`),
            ]);
            return video;
        },
        catch: (error) => new VideoError(`Failed to add video: ${error}`)
    });
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (video) => ({ success: true, video }),
        onFailure: (error) => {
            console.error('Error adding video:', error);
            return { success: false, error: error.message };
        }
    }));
    if (!result.success) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.status(200).json({
        success: true,
        video: result.video
    });
};
exports.addVideo = addVideo;
/**
 * Get videos by user
 */
const getVideosByUser = async (req, res) => {
    const cacheKey = `user:${req.userId}:videos`;
    const program = effect_1.Effect.tryPromise({
        try: async () => {
            // Try to get from cache first
            const cachedVideos = await redis_1.RedisService.get(cacheKey);
            if (cachedVideos) {
                return JSON.parse(cachedVideos);
            }
            // If not in cache, fetch from database
            const videos = await video_model_1.default.find({ user: req.userId }).sort({
                createdAt: "desc",
            });
            // Cache for 5 minutes
            await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);
            return videos;
        },
        catch: (error) => new VideoError(`Failed to get videos by user: ${error}`)
    });
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (videos) => ({ success: true, videos }),
        onFailure: (error) => {
            console.error('Error getting videos by user:', error);
            return { success: false, error: error.message };
        }
    }));
    if (!result.success) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.json({
        success: true,
        videos: result.videos
    });
};
exports.getVideosByUser = getVideosByUser;
/**
 * Get all videos
 */
const getAllVideos = async (req, res) => {
    const cacheKey = "videos:all";
    const program = effect_1.Effect.tryPromise({
        try: async () => {
            // Try to get from cache first
            const cachedVideos = await redis_1.RedisService.get(cacheKey);
            if (cachedVideos) {
                return JSON.parse(cachedVideos);
            }
            // If not in cache, fetch from database
            const videos = await video_model_1.default.find().sort({ createdAt: "desc" });
            // Cache for 5 minutes
            await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);
            return videos;
        },
        catch: (error) => new VideoError(`Failed to get all videos: ${error}`)
    });
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (videos) => ({ success: true, videos }),
        onFailure: (error) => {
            console.error('Error getting all videos:', error);
            return { success: false, error: error.message };
        }
    }));
    if (!result.success) {
        return res.status(500).json({
            success: false,
            message: result.error
        });
    }
    res.json({
        success: true,
        videos: result.videos
    });
};
exports.getAllVideos = getAllVideos;
/**
 * Delete a video
 */
const deleteVideo = async (req, res) => {
    const videoId = req.params.id;
    const program = effect_1.Effect.tryPromise({
        try: async () => {
            const video = await video_model_1.default.findByIdAndDelete(videoId);
            if (!video) {
                throw new VideoNotFoundError(videoId);
            }
            // Invalidate caches
            await Promise.all([
                redis_1.RedisService.delete("videos:all"),
                redis_1.RedisService.delete(`user:${req.userId}:videos`),
            ]);
            return { message: "Video deleted successfully" };
        },
        catch: (error) => {
            if (error instanceof VideoNotFoundError) {
                return error;
            }
            return new VideoError(`Failed to delete video: ${error}`);
        }
    });
    const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
        onSuccess: (data) => ({ success: true, data }),
        onFailure: (error) => {
            console.error('Error deleting video:', error);
            if (error instanceof VideoNotFoundError) {
                return {
                    success: false,
                    error: error.message,
                    notFound: true
                };
            }
            return { success: false, error: error.message };
        }
    }));
    if (!result.success) {
        const statusCode = result.notFound ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: result.error
        });
    }
    res.status(200).json({
        success: true,
        message: result.data.message
    });
};
exports.deleteVideo = deleteVideo;
