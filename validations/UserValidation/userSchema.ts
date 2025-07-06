import Joi from 'joi'

export const userSchema = {
  registerUser: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long'
      })
  }),

  loginUser: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  editUser: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    avatarUrl: Joi.string()
      .allow('')
      .pattern(/\.(jpg|jpeg|png|webp)$/i)
      .messages({
        'string.pattern.base': 'Avatar URL must end with a valid image extension (.jpg, .jpeg, .png, or .gif)'
      })
  })
}