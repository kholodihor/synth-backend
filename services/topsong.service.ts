import { Effect } from 'effect';
import TopSongModel from '../models/topsong.model';

// Define error types for better error handling
export class TopSongCreationError extends Error {
  readonly _tag = 'TopSongCreationError';
  constructor(message: string = 'Failed to create top song') {
    super(message);
  }
}

// Effect-based top song creation
export const addTopSong = (songData: { title: string; artist: string; song: string }) => {
  return Effect.tryPromise({
    try: async () => {
      const { title, artist, song } = songData;
      
      const newSong = new TopSongModel({
        title,
        artist,
        song,
      });
      
      const savedSong = await newSong.save();
      return savedSong;
    },
    catch: (error) => {
      console.error('Error adding top song:', error);
      return new TopSongCreationError(`Failed to add top song: ${error}`);
    }
  });
};

// Effect-based get all top songs
export const getTopSongs = () => {
  return Effect.tryPromise({
    try: async () => {
      const songs = await TopSongModel.find();
      return songs;
    },
    catch: (error) => {
      console.error('Error getting top songs:', error);
      return new Error(`Failed to get top songs: ${error}`);
    }
  });
};