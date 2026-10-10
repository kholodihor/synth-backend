import { RequestHandler } from "express";
import SongModel from "../models/song.model";
import { RedisService } from "../utils/redis";

export const addSong: RequestHandler = async (req, res) => {
  const { title, artist, song } = req.body;
  try {
    const newSong = await new SongModel({
      title,
      artist,
      song,
      user: req.userId,
    }).save();

    await RedisService.delete(`user:${req.userId}:songs`);

    res.status(201).json(newSong);
  } catch (error) {
    console.error("Add song error:", error);
    res.status(500).json({ success: false, message: "Failed to add song" });
  }
};

export const getSongsByUser: RequestHandler = async (req, res) => {
  try {
    const cacheKey = `user:${req.userId}:songs`;
    const cachedSongs = await RedisService.get(cacheKey);
    if (cachedSongs) {
      return res.json(cachedSongs);
    }

    const songs = await SongModel.find({ user: req.userId }).sort({
      createdAt: "desc",
    });

    await RedisService.setWithTTL(cacheKey, songs, 300);
    res.json(songs);
  } catch (error) {
    console.error("Get songs error:", error);
    res.status(500).json({ success: false, message: "Failed to get songs" });
  }
};

export const deleteSong: RequestHandler = async (req, res) => {
  try {
    const song = await SongModel.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }
    if (song.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own songs" });
    }

    await SongModel.findByIdAndDelete(req.params.id);
    await RedisService.delete(`user:${req.userId}:songs`);

    res.json({ success: true, message: "Song deleted" });
  } catch (error) {
    console.error("Delete song error:", error);
    res.status(500).json({ success: false, message: "Failed to delete song" });
  }
};
