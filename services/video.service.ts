import { Effect } from 'effect';
import VideoModel from '../models/video.model';
import { RedisService } from '../utils/redis';

// Define error types for better error handling
export class VideoNotFoundError extends Error {
  readonly _tag = 'VideoNotFoundError';
  constructor(message: string = 'Video not found') {
    super(message);
  }
}

export class VideoCreationError extends Error {
  readonly _tag = 'VideoCreationError';
  constructor(message: string = 'Failed to create video') {
    super(message);
  }
}

// Effect-based video creation
export const addVideo = (videoData: { title: string; url: string }, userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const { title, url } = videoData;
      
      const newVideo = new VideoModel({
        title,
        url,
        user: userId,
      });
      
      const savedVideo = await newVideo.save();

      // Invalidate caches
      await Promise.all([
        RedisService.delete("videos:all"),
        RedisService.delete(`user:${userId}:videos`),
      ]);

      return savedVideo;
    },
    catch: (error) => {
      console.error('Error adding video:', error);
      return new VideoCreationError(`Failed to add video: ${error}`);
    }
  });
};

// Effect-based get videos by user
export const getVideosByUser = (userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const cacheKey = `user:${userId}:videos`;
      const cachedVideos = await RedisService.get(cacheKey);

      if (cachedVideos) {
        return cachedVideos;
      }

      const videos = await VideoModel.find({ user: userId }).sort({
        createdAt: "desc",
      });

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, videos, 300);

      return videos;
    },
    catch: (error) => {
      console.error('Error getting videos by user:', error);
      return new Error(`Failed to get videos by user: ${error}`);
    }
  });
};

// Effect-based get all videos
export const getAllVideos = () => {
  return Effect.tryPromise({
    try: async () => {
      const cacheKey = "videos:all";
      const cachedVideos = await RedisService.get(cacheKey);

      if (cachedVideos) {
        return cachedVideos;
      }

      const videos = await VideoModel.find().sort({ createdAt: "desc" });

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, videos, 300);

      return videos;
    },
    catch: (error) => {
      console.error('Error getting all videos:', error);
      return new Error(`Failed to get all videos: ${error}`);
    }
  });
};

// Effect-based delete video
export const deleteVideo = (videoId: string, userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const video = await VideoModel.findByIdAndDelete(videoId);
      
      if (!video) {
        throw new VideoNotFoundError();
      }

      // Invalidate caches
      await Promise.all([
        RedisService.delete("videos:all"),
        RedisService.delete(`user:${userId}:videos`),
      ]);

      return { success: true, message: "Video deleted" };
    },
    catch: (error) => {
      if (error instanceof VideoNotFoundError) {
        return error;
      }
      console.error('Error deleting video:', error);
      return new Error(`Failed to delete video: ${error}`);
    }
  });
};