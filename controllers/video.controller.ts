import { RequestHandler } from "express";
import VideoModel from "../models/video.model";
import { RedisService } from "../utils/redis";

const invalidateVideoCaches = (userId: string) =>
  Promise.all([
    RedisService.delete("videos:all"),
    RedisService.delete(`user:${userId}:videos`),
  ]);

export const addVideo: RequestHandler = async (req, res) => {
  try {
    const { title, url } = req.body;
    const video = await new VideoModel({ title, url, user: req.userId }).save();

    await invalidateVideoCaches(req.userId);

    res.status(201).json({ success: true, video });
  } catch (error) {
    console.error("Add video error:", error);
    res.status(500).json({ success: false, message: "Failed to add video" });
  }
};

export const getVideosByUser: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `user:${req.userId}:videos`;
    const cachedVideos = await RedisService.get(cacheKey);
    if (cachedVideos) {
      return res.json({ success: true, videos: cachedVideos });
    }

    const videos = await VideoModel.find({ user: req.userId }).sort({
      createdAt: "desc",
    });

    await RedisService.setWithTTL(cacheKey, videos, 300);
    res.json({ success: true, videos });
  } catch (error) {
    console.error("Get user videos error:", error);
    res.status(500).json({ success: false, message: "Failed to get videos" });
  }
};

export const getAllVideos: RequestHandler = async (req, res) => {
  try {
    const cacheKey = "videos:all";
    const cachedVideos = await RedisService.get(cacheKey);
    if (cachedVideos) {
      return res.json({ success: true, videos: cachedVideos });
    }

    const videos = await VideoModel.find().sort({ createdAt: "desc" });

    await RedisService.setWithTTL(cacheKey, videos, 300);
    res.json({ success: true, videos });
  } catch (error) {
    console.error("Get videos error:", error);
    res.status(500).json({ success: false, message: "Failed to get videos" });
  }
};

export const deleteVideo: RequestHandler = async (req, res) => {
  try {
    const video = await VideoModel.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    if (video.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own videos" });
    }

    await VideoModel.findByIdAndDelete(req.params.id);
    await invalidateVideoCaches(req.userId);

    res.json({ success: true, message: "Video deleted" });
  } catch (error) {
    console.error("Delete video error:", error);
    res.status(500).json({ success: false, message: "Failed to delete video" });
  }
};
