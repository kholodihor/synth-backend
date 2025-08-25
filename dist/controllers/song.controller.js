"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSong = exports.getSongsByUser = exports.addSong = void 0;
const song_model_1 = __importDefault(require("../models/song.model"));
const redis_1 = require("../utils/redis");
const addSong = async (req, res) => {
    const { title, artist, song } = req.body;
    try {
        const newSong = new song_model_1.default({
            title,
            artist,
            song,
            user: req.userId,
        });
        await newSong.save();
        // Invalidate user's songs cache
        await redis_1.RedisService.delete(`user:${req.userId}:songs`);
        res.status(200).json(newSong);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Fail to add song",
        });
    }
};
exports.addSong = addSong;
const getSongsByUser = async (req, res) => {
    try {
        const cacheKey = `user:${req.userId}:songs`;
        const cachedSongs = await redis_1.RedisService.get(cacheKey);
        if (cachedSongs) {
            return res.json(JSON.parse(cachedSongs));
        }
        const songs = await song_model_1.default.find({ user: req.userId }).sort({
            createdAt: "desc",
        });
        // Cache for 5 minutes
        await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(songs), 300);
        return res.json(songs);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t get Song",
        });
    }
};
exports.getSongsByUser = getSongsByUser;
const deleteSong = async (req, res) => {
    try {
        const songId = req.params.id;
        const song = await song_model_1.default.findByIdAndDelete(songId);
        if (!song) {
            return res.status(404).json({
                message: "Song not found",
            });
        }
        // Invalidate user's songs cache
        await redis_1.RedisService.delete(`user:${req.userId}:songs`);
        res.status(200).json("Song deleted");
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Can`t delete song",
        });
    }
};
exports.deleteSong = deleteSong;
