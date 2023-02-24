import { RequestHandler } from 'express';
import { songSchema } from './songSchema';
import validator from '../validator';

export const addSongValidation:RequestHandler = (req, res, next) => {
  validator(songSchema.addSong, req.body, next);
};
