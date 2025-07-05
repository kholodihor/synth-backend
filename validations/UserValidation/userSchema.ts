import Joi from 'joi'

export const userSchema = {
  registerUser: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, underscores and dashes',
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
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
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
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, underscores and dashes',
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