import { RequestHandler } from 'express';
import VideoModel from '../models/VideoModel';

export const addVideo: RequestHandler = async (req, res, next) => {
  const { title, url } = req.body;
  try {
    const newVideo = new VideoModel({
      title,
      url,
      user: req.userId,
    });
    await newVideo.save();
    res.status(200).json(newVideo);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to add a video"
    });
  }
};

export const getVideosByUser: RequestHandler = async (req, res, next) => {
  try {
    const videos = await VideoModel.find({ user: req.userId });
    res.json(videos);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to get videos by user"
    });
  }
};

export const getAllVideos: RequestHandler = async (req, res, next) => {
  try {
    const videos = await VideoModel.find().sort({ createdAt: 'desc' });
    return res.json(videos);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to get videos"
    });
  }
};

export const deleteVideo:RequestHandler = async (req, res) => {
  try {
    const videoId = req.params.id;
    await VideoModel.findOneAndDelete({ _id: videoId });
    res.status(200).json('Video deleted');
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to delete videos"
    });
  }
};
