import Joi from 'joi';

export const songSchema = {
  addSong: Joi.object({
    title: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Song title must not be empty',
        'string.max': 'Song title cannot exceed 100 characters',
        'string.empty': 'Song title is required'
      }),
    artist: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Artist name must not be empty',
        'string.max': 'Artist name cannot exceed 100 characters',
        'string.empty': 'Artist name is required'
      }),
    song: Joi.string()
      .required()
      .pattern(/\.(mp3|wav|ogg|m4a)$/i)
      .messages({
        'string.empty': 'Song file is required',
        'string.pattern.base': 'Song file must be a valid audio format (.mp3, .wav, .ogg, or .m4a)'
      })
  })
};
