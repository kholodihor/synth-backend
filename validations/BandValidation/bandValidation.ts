import { RequestHandler } from 'express';
import { bandSchema } from './bandSchema';
import validator from '../validator';

export const createBandValidation:RequestHandler = (req, res, next) => {
  validator(bandSchema.createBand, req.body, next);
};
