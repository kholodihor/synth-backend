import Joi from 'joi'

export const userSchema = {
  registerUser: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[\p{L}\p{N} _-]+$/u)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, spaces, underscores and dashes',
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
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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
      .pattern(/^[\p{L}\p{N} _-]+$/u)
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, spaces, underscores and dashes',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    avatarUrl: Joi.string()
      .allow('')
      .uri({ scheme: ['http', 'https'] })
      .messages({
        'string.uri': 'Avatar URL must be a valid http(s) URL'
      })
  })
}