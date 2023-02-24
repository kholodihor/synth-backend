import Joi from 'joi';

export const bandSchema = {
  createBand: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    location: Joi.string(),
    image: Joi.string().default('')
  }),
};
