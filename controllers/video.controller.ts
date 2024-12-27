import { RequestHandler } from "express";
import VideoModel from "../models/video.model";
import { RedisService } from "../utils/redis";

export const addVideo: RequestHandler = async (req, res, next) => {
  try {
    const { title, url } = req.body;
    const newVideo = new VideoModel({
      title,
      url,
      user: req.userId,
    });
    await newVideo.save();

    // Invalidate caches
    await Promise.all([
      RedisService.delete("videos:all"),
      RedisService.delete(`user:${req.userId}:videos`),
    ]);

    res.status(200).json(newVideo);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to add a video",
    });
  }
};

export const getVideosByUser: RequestHandler = async (req, res, next) => {
  try {
    const cacheKey = `user:${req.userId}:videos`;
    const cachedVideos = await RedisService.get(cacheKey);

    if (cachedVideos) {
      return res.json(JSON.parse(cachedVideos));
    }

    const videos = await VideoModel.find({ user: req.userId }).sort({
      createdAt: "desc",
    });

    // Cache for 5 minutes
    await RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);

    res.json(videos);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to get videos by user",
    });
  }
};

export const getAllVideos: RequestHandler = async (req, res, next) => {
  try {
    const cacheKey = "videos:all";
    const cachedVideos = await RedisService.get(cacheKey);

    if (cachedVideos) {
      return res.json(JSON.parse(cachedVideos));
    }

    const videos = await VideoModel.find().sort({ createdAt: "desc" });

    // Cache for 5 minutes
    await RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);

    return res.json(videos);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to get videos",
    });
  }
};

export const deleteVideo: RequestHandler = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await VideoModel.findByIdAndDelete(videoId);
    if (!video) {
      return res.status(404).json({
        message: "Video not found",
      });
    }

    // Invalidate caches
    await Promise.all([
      RedisService.delete("videos:all"),
      RedisService.delete(`user:${req.userId}:videos`),
    ]);

    res.status(200).json("Video deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to delete videos",
    });
  }
};
