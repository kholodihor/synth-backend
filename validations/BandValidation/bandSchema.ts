import Joi from 'joi';

export const bandSchema = {
  createBand: Joi.object({
    title: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Band title must be at least 2 characters long',
        'string.max': 'Band title cannot exceed 100 characters',
        'string.empty': 'Band title is required'
      }),
    description: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    location: Joi.string()
      .max(100)
      .allow('')
      .messages({
        'string.max': 'Location cannot exceed 100 characters'
      }),
    image: Joi.string()
      .allow('')
      .uri({ scheme: ['http', 'https'] })
      .messages({
        'string.uri': 'Image must be a valid http(s) URL'
      })
  })
};
