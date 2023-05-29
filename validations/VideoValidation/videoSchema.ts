import Joi from 'joi';

export const videoSchema = {
  addVideo: Joi.object({
    title: Joi.string().required(),
    url: Joi.string().uri().required()
  }),
};