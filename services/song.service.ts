import { Effect } from 'effect';
import SongModel from '../models/song.model';
import { RedisService } from '../utils/redis';

// Define error types for better error handling
export class SongNotFoundError extends Error {
  readonly _tag = 'SongNotFoundError';
  constructor(message: string = 'Song not found') {
    super(message);
  }
}

export class SongCreationError extends Error {
  readonly _tag = 'SongCreationError';
  constructor(message: string = 'Failed to create song') {
    super(message);
  }
}

// Effect-based song creation
export const addSong = (songData: { title: string; artist: string; song: string }, userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const { title, artist, song } = songData;

      const newSong = new SongModel({
        title,
        artist,
        song,
        user: userId,
      });

      const savedSong = await newSong.save();

      // Invalidate user's songs cache
      await RedisService.delete(`user:${userId}:songs`);

      return savedSong;
    },
    catch: (error) => {
      console.error('Error adding song:', error);
      return new SongCreationError(`Failed to add song: ${error}`);
    }
  });
};

// Effect-based get songs by user
export const getSongsByUser = (userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const cacheKey = `user:${userId}:songs`;
      const cachedSongs = await RedisService.get(cacheKey);

      if (cachedSongs) {
        return cachedSongs;
      }

      const songs = await SongModel.find({ user: userId }).sort({
        createdAt: "desc",
      });

      // Cache for 5 minutes
      await RedisService.setWithTTL(cacheKey, songs, 300);

      return songs;
    },
    catch: (error) => {
      console.error('Error getting songs by user:', error);
      return new Error(`Failed to get songs by user: ${error}`);
    }
  });
};

// Effect-based delete song
export const deleteSong = (songId: string, userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      const song = await SongModel.findByIdAndDelete(songId);

      if (!song) {
        throw new SongNotFoundError();
      }

      // Invalidate user's songs cache
      await RedisService.delete(`user:${userId}:songs`);

      return { success: true, message: "Song deleted" };
    },
    catch: (error) => {
      if (error instanceof SongNotFoundError) {
        return error;
      }
      console.error('Error deleting song:', error);
      return new Error(`Failed to delete song: ${error}`);
    }
  });
};