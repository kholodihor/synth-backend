import { Effect } from 'effect';
import { RequestHandler } from "express";
import VideoModel from "../models/video.model";
import { RedisService } from "../utils/redis";

/**
 * Effect-based controller for video operations
 * This controller uses Effect for error handling and functional composition
 * while maintaining compatibility with the existing model
 */

// Error types
export class VideoError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'VideoError';
  }
}

export class VideoNotFoundError extends VideoError {
  constructor(id: string) {
    super(`Video with id ${id} not found`);
    this.name = 'VideoNotFoundError';
  }
}

/**
 * Add a new video
 */
export const addVideo: RequestHandler = async (req, res) => {
  const { title, url } = req.body;
  
  const program = Effect.tryPromise({
    try: async () => {
      const video = new VideoModel({
        title,
        url,
        user: req.userId,
      });

      await video.save();

      // Invalidate caches
      await Promise.all([
        RedisService.delete("videos:all"),
        RedisService.delete(`user:${req.userId}:videos`),
      ]);

      return video;
    },
    catch: (error) => new VideoError(`Failed to add video: ${error}`)
  });

  type AddVideoResult = 
    | { success: true; video: any }
    | { success: false; error: string };
    
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (video): AddVideoResult => ({ success: true, video }),
      onFailure: (error): AddVideoResult => {
        console.error('Error adding video:', error);
        return { success: false, error: error.message };
      }
    })
  );

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

/**
 * Get videos by user
 */
export const getVideosByUser: RequestHandler = async (req, res) => {
  const cacheKey = `user:${req.userId}:videos`;
  
  const program = Effect.tryPromise({
    try: async () => {
      // Try to get from cache first
      const cachedVideos = await RedisService.get(cacheKey);
      
      if (cachedVideos) {
        return JSON.parse(cachedVideos);
      }
      
      // If not in cache, fetch from database
      const videos = await VideoModel.find({ user: req.userId }).sort({
        createdAt: "desc",
      });
      
      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);
      
      return videos;
    },
    catch: (error) => new VideoError(`Failed to get videos by user: ${error}`)
  });

  type VideosResult = 
    | { success: true; videos: any[] }
    | { success: false; error: string };
    
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (videos): VideosResult => ({ success: true, videos }),
      onFailure: (error): VideosResult => {
        console.error('Error getting videos by user:', error);
        return { success: false, error: error.message };
      }
    })
  );

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

/**
 * Get all videos
 */
export const getAllVideos: RequestHandler = async (req, res) => {
  const cacheKey = "videos:all";
  
  const program = Effect.tryPromise({
    try: async () => {
      // Try to get from cache first
      const cachedVideos = await RedisService.get(cacheKey);
      
      if (cachedVideos) {
        return JSON.parse(cachedVideos);
      }
      
      // If not in cache, fetch from database
      const videos = await VideoModel.find().sort({ createdAt: "desc" });
      
      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, JSON.stringify(videos), 300);
      
      return videos;
    },
    catch: (error) => new VideoError(`Failed to get all videos: ${error}`)
  });

  type VideosResult = 
    | { success: true; videos: any[] }
    | { success: false; error: string };
    
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (videos): VideosResult => ({ success: true, videos }),
      onFailure: (error): VideosResult => {
        console.error('Error getting all videos:', error);
        return { success: false, error: error.message };
      }
    })
  );

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

/**
 * Delete a video
 */
export const deleteVideo: RequestHandler = async (req, res) => {
  const videoId = req.params.id;
  
  const program = Effect.tryPromise({
    try: async () => {
      const video = await VideoModel.findByIdAndDelete(videoId);
      
      if (!video) {
        throw new VideoNotFoundError(videoId);
      }
      
      // Invalidate caches
      await Promise.all([
        RedisService.delete("videos:all"),
        RedisService.delete(`user:${req.userId}:videos`),
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

  type DeleteVideoResult = 
    | { success: true; data: { message: string } }
    | { success: false; error: string; notFound?: boolean };
    
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (data): DeleteVideoResult => ({ success: true, data }),
      onFailure: (error): DeleteVideoResult => {
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
    })
  );

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
