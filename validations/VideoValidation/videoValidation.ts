import { RequestHandler } from 'express';
import { videoSchema } from './videoSchema';
import validator from '../validator';

export const addVideoValidation: RequestHandler = (req, res, next) => {
  validator(videoSchema.addVideo, req.body, next);
};
