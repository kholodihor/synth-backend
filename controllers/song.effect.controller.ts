import { RequestHandler } from "express";
import { Effect } from "effect";
import * as SongService from "../services/song.service";

export const addSong: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Add song request for userId:', userId);

  Effect.runPromise(SongService.addSong(req.body, userId))
    .then(song => {
      res.status(200).json(song);
    })
    .catch(error => {
      if (error._tag === 'SongCreationError') {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error in addSong controller:', error);
        res.status(500).json({ message: "Fail to add song" });
      }
    });
};

export const getSongsByUser: RequestHandler = async (req, res) => {
  // If we're on the /user/songs route, there won't be an id param
  // In that case, use the authenticated user's ID from req.userId
  const userId = req.params.id || req.userId as string;
  console.log('Get songs by user request for userId:', userId);

  Effect.runPromise(SongService.getSongsByUser(userId))
    .then(songs => {
      res.json(songs);
    })
    .catch(error => {
      console.error('Error in getSongsByUser controller:', error);
      res.status(500).json({ message: "Can't get songs" });
    });
};

export const deleteSong: RequestHandler = async (req, res) => {
  const songId = req.params.id;
  const userId = req.userId as string;
  console.log('Delete song request for songId:', songId);

  Effect.runPromise(SongService.deleteSong(songId, userId))
    .then(result => {
      res.status(200).json(result.message);
    })
    .catch(error => {
      if (error._tag === 'SongNotFoundError') {
        res.status(404).json({ message: "Song not found" });
      } else {
        console.error('Error in deleteSong controller:', error);
        res.status(500).json({ message: "Can't delete song" });
      }
    });
};