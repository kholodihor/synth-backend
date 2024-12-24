import Joi from 'joi';

export const videoSchema = {
  addVideo: Joi.object({
    title: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Video title must not be empty',
        'string.max': 'Video title cannot exceed 100 characters',
        'string.empty': 'Video title is required'
      }),
    url: Joi.string()
      .required()
      .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
      .messages({
        'string.empty': 'Video URL is required',
        'string.pattern.base': 'Please provide a valid YouTube video URL'
      })
  })
};