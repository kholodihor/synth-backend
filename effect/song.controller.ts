import { Effect, pipe } from 'effect';
import { RequestHandler } from "express";
import SongModel from "../models/song.model";
import { RedisService } from "../utils/redis";

/**
 * Effect-based controller for song operations
 * This controller uses Effect for error handling and functional composition
 * while maintaining compatibility with the existing model
 */

/**
 * Add a new song
 */
export const addSong: RequestHandler = async (req, res) => {
  const { title, artist, song } = req.body;
  
  const program = pipe(
    Effect.tryPromise({
      try: async () => {
        const newSong = new SongModel({
          title,
          artist,
          song,
          user: req.userId,
        });
        return await newSong.save();
      },
      catch: (error) => new Error(`Failed to add song: ${error}`)
    }),
    Effect.flatMap((song) => 
      Effect.tryPromise({
        try: async () => {
          // Invalidate user's songs cache
          await RedisService.delete(`user:${req.userId}:songs`);
          return song;
        },
        catch: (error) => new Error(`Failed to invalidate cache: ${error}`)
      })
    ),
    Effect.match({
      onSuccess: (song) => {
        res.status(200).json(song);
      },
      onFailure: (error) => {
        console.log(error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to add song"
        });
      }
    })
  );

  // Run the Effect program
  await Effect.runPromise(program);
};

/**
 * Get songs by user ID
 */
export const getSongsByUser: RequestHandler = async (req, res) => {
  const getSongsProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const cacheKey = `user:${req.userId}:songs`;
        const cachedSongs = await RedisService.get(cacheKey);

        if (cachedSongs) {
          return JSON.parse(cachedSongs);
        }

        const songs = await SongModel.find({ user: req.userId }).sort({
          createdAt: "desc",
        });

        // Cache for 5 minutes
        await RedisService.setWithTTL(cacheKey, JSON.stringify(songs), 300);

        return songs;
      },
      catch: (error) => new Error(`Failed to get songs: ${error}`)
    }),
    Effect.match({
      onSuccess: (songs) => {
        res.json(songs);
      },
      onFailure: (error) => {
        console.log(error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to get songs"
        });
      }
    })
  );

  await Effect.runPromise(getSongsProgram);
};

/**
 * Delete a song
 */
export const deleteSong: RequestHandler = async (req, res) => {
  const deleteSongProgram = pipe(
    Effect.tryPromise({
      try: async () => {
        const songId = req.params.id;
        const song = await SongModel.findByIdAndDelete(songId);
        
        if (!song) {
          throw new Error("Song not found");
        }

        // Invalidate user's songs cache
        await RedisService.delete(`user:${req.userId}:songs`);

        return song;
      },
      catch: (error) => error instanceof Error ? error : new Error(`Failed to delete song: ${error}`)
    }),
    Effect.match({
      onSuccess: () => {
        res.status(200).json("Song deleted");
      },
      onFailure: (error) => {
        console.log(error);
        if (error.message === "Song not found") {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({
            message: "Failed to delete song"
          });
        }
      }
    })
  );

  await Effect.runPromise(deleteSongProgram);
};
