import { RequestHandler } from "express";
import { Effect } from "effect";
import * as TopSongService from "../services/topsong.service";

export const addTopSong: RequestHandler = async (req, res) => {
  console.log('Add top song request');
  
  Effect.runPromise(TopSongService.addTopSong(req.body))
    .then(song => {
      res.status(200).json(song);
    })
    .catch(error => {
      if (error._tag === 'TopSongCreationError') {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Error in addTopSong controller:', error);
        res.status(500).json({ message: "Can't add song" });
      }
    });
};

export const getTopSongs: RequestHandler = async (req, res) => {
  console.log('Get top songs request');
  
  Effect.runPromise(TopSongService.getTopSongs())
    .then(songs => {
      res.json(songs);
    })
    .catch(error => {
      console.error('Error in getTopSongs controller:', error);
      res.status(500).json({ message: "Can't get Topsongs" });
    });
};