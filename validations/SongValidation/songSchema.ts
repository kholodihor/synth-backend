import Joi from 'joi';

export const songSchema = {
  addSong: Joi.object({
    title: Joi.string(),
    artist: Joi.string(),
    song: Joi.string()
  }),
};
