import { RequestHandler } from 'express';
import SongModel from '../models/SongModel';

export const addSong:RequestHandler = async (req, res) => {
  const { title, artist, song } = req.body;
  try {
    const newSong = new SongModel({
      title,
      artist,
      song,
      user: req.userId,
    });
    await newSong.save();
    res.status(200).json(newSong);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to add song",
    });
  }
};

export const getSongsByUser:RequestHandler = async (req, res) => {
  try {
    const songs = await SongModel.find({ user: req.userId })
    return res.json(songs);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Can`t get Song",
    });
  }
};

export const deleteSong:RequestHandler = async (req, res) => {
  try {
    const songId = req.params.id;
    await SongModel.findOneAndDelete({ _id: songId });
    res.status(200).json('Song deleted');
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Can`t delete song",
    });
  }
};
