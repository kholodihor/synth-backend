import { RequestHandler } from 'express';
import TopSongModel from '../models/TopSongModel';

export const addTopSong:RequestHandler = async (req, res, next) => {
  const { title, artist, song } = req.body;
  try {
    const newSong = new TopSongModel({
      title,
      artist,
      song,
    });
    await newSong.save();
    res.status(200).json(newSong);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Can`t add song",
    });
  }
};

export const getTopSongs:RequestHandler = async (req, res, next) => {
  try {
    const songs = await TopSongModel.find()
    return res.json(songs);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Can`t get Topsongs",
    });
  }
};