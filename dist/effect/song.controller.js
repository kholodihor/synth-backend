"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSong = exports.getSongsByUser = exports.addSong = void 0;
const effect_1 = require("effect");
const song_model_1 = __importDefault(require("../models/song.model"));
const redis_1 = require("../utils/redis");
/**
 * Effect-based controller for song operations
 * This controller uses Effect for error handling and functional composition
 * while maintaining compatibility with the existing model
 */
/**
 * Add a new song
 */
const addSong = async (req, res) => {
    const { title, artist, song } = req.body;
    const program = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const newSong = new song_model_1.default({
                title,
                artist,
                song,
                user: req.userId,
            });
            return await newSong.save();
        },
        catch: (error) => new Error(`Failed to add song: ${error}`)
    }), effect_1.Effect.flatMap((song) => effect_1.Effect.tryPromise({
        try: async () => {
            // Invalidate user's songs cache
            await redis_1.RedisService.delete(`user:${req.userId}:songs`);
            return song;
        },
        catch: (error) => new Error(`Failed to invalidate cache: ${error}`)
    })), effect_1.Effect.match({
        onSuccess: (song) => {
            res.status(200).json(song);
        },
        onFailure: (error) => {
            console.log(error);
            res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to add song"
            });
        }
    }));
    // Run the Effect program
    await effect_1.Effect.runPromise(program);
};
exports.addSong = addSong;
/**
 * Get songs by user ID
 */
const getSongsByUser = async (req, res) => {
    const getSongsProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const cacheKey = `user:${req.userId}:songs`;
            const cachedSongs = await redis_1.RedisService.get(cacheKey);
            if (cachedSongs) {
                return JSON.parse(cachedSongs);
            }
            const songs = await song_model_1.default.find({ user: req.userId }).sort({
                createdAt: "desc",
            });
            // Cache for 5 minutes
            await redis_1.RedisService.setWithTTL(cacheKey, JSON.stringify(songs), 300);
            return songs;
        },
        catch: (error) => new Error(`Failed to get songs: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: (songs) => {
            res.json(songs);
        },
        onFailure: (error) => {
            console.log(error);
            res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to get songs"
            });
        }
    }));
    await effect_1.Effect.runPromise(getSongsProgram);
};
exports.getSongsByUser = getSongsByUser;
/**
 * Delete a song
 */
const deleteSong = async (req, res) => {
    const deleteSongProgram = (0, effect_1.pipe)(effect_1.Effect.tryPromise({
        try: async () => {
            const songId = req.params.id;
            const song = await song_model_1.default.findByIdAndDelete(songId);
            if (!song) {
                throw new Error("Song not found");
            }
            // Invalidate user's songs cache
            await redis_1.RedisService.delete(`user:${req.userId}:songs`);
            return song;
        },
        catch: (error) => error instanceof Error ? error : new Error(`Failed to delete song: ${error}`)
    }), effect_1.Effect.match({
        onSuccess: () => {
            res.status(200).json("Song deleted");
        },
        onFailure: (error) => {
            console.log(error);
            if (error.message === "Song not found") {
                res.status(404).json({ message: error.message });
            }
            else {
                res.status(500).json({
                    message: "Failed to delete song"
                });
            }
        }
    }));
    await effect_1.Effect.runPromise(deleteSongProgram);
};
exports.deleteSong = deleteSong;
