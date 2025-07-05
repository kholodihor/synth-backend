import { RequestHandler } from "express";
import { Effect } from "effect";
import * as VideoService from "../services/video.service";

export const addVideo: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Add video request for userId:', userId);
  
  Effect.runPromise(VideoService.addVideo(req.body, userId))
    .then(video => {
      res.status(200).json(video);
    })
    .catch(error => {
      if (error._tag === 'VideoCreationError') {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error in addVideo controller:', error);
        res.status(500).json({ message: "Fail to add a video" });
      }
    });
};

export const getVideosByUser: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Get videos by user request for userId:', userId);
  
  Effect.runPromise(VideoService.getVideosByUser(userId))
    .then(videos => {
      res.json(videos);
    })
    .catch(error => {
      console.error('Error in getVideosByUser controller:', error);
      res.status(500).json({ message: "Fail to get videos by user" });
    });
};

export const getAllVideos: RequestHandler = async (req, res) => {
  console.log('Get all videos request');
  
  Effect.runPromise(VideoService.getAllVideos())
    .then(videos => {
      res.json(videos);
    })
    .catch(error => {
      console.error('Error in getAllVideos controller:', error);
      res.status(500).json({ message: "Fail to get videos" });
    });
};

export const deleteVideo: RequestHandler = async (req, res) => {
  const videoId = req.params.id;
  const userId = req.userId as string;
  console.log('Delete video request for videoId:', videoId);
  
  Effect.runPromise(VideoService.deleteVideo(videoId, userId))
    .then(result => {
      res.status(200).json(result.message);
    })
    .catch(error => {
      if (error._tag === 'VideoNotFoundError') {
        res.status(404).json({ message: "Video not found" });
      } else {
        console.error('Error in deleteVideo controller:', error);
        res.status(500).json({ message: "Fail to delete video" });
      }
    });
};