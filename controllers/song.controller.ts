import { RequestHandler } from "express";
import SongModel from "../models/song.model";
import { RedisService } from "../utils/redis";

export const addSong: RequestHandler = async (req, res) => {
  const { title, artist, song } = req.body;
  try {
    const newSong = new SongModel({
      title,
      artist,
      song,
      user: req.userId,
    });
    await newSong.save();

    // Invalidate user's songs cache
    await RedisService.delete(`user:${req.userId}:songs`);

    res.status(200).json(newSong);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to add song",
    });
  }
};

export const getSongsByUser: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `user:${req.userId}:songs`;
    const cachedSongs = await RedisService.get(cacheKey);

    if (cachedSongs) {
      return res.json(JSON.parse(cachedSongs));
    }

    const songs = await SongModel.find({ user: req.userId }).sort({
      createdAt: "desc",
    });

    // Cache for 5 minutes
    await RedisService.setWithTTL(cacheKey, JSON.stringify(songs), 300);

    return res.json(songs);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Can`t get Song",
    });
  }
};

export const deleteSong: RequestHandler = async (req, res) => {
  try {
    const songId = req.params.id;
    const song = await SongModel.findByIdAndDelete(songId);
    if (!song) {
      return res.status(404).json({
        message: "Song not found",
      });
    }

    // Invalidate user's songs cache
    await RedisService.delete(`user:${req.userId}:songs`);

    res.status(200).json("Song deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Can`t delete song",
    });
  }
};
