import Joi from 'joi'

export const uploadSchema = {
  /**
   * Schema for avatar image uploads
   * Validates that the image is provided and is a base64 string
   */
  uploadAvatar: Joi.object({
    image: Joi.string()
      .required()
      .pattern(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)
      .messages({
        'string.pattern.base': 'Invalid image format. Must be a valid base64 encoded image.',
        'string.empty': 'Image is required',
        'any.required': 'Image is required'
      })
  }),

  /**
   * Schema for band image uploads
   * Validates that the image is provided and is a base64 string
   */
  uploadBandImage: Joi.object({
    image: Joi.string()
      .required()
      .pattern(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)
      .messages({
        'string.pattern.base': 'Invalid image format. Must be a valid base64 encoded image.',
        'string.empty': 'Image is required',
        'any.required': 'Image is required'
      })
  }),

  /**
   * Schema for song uploads
   * Currently minimal validation as song uploads use multer
   */
  uploadSong: Joi.object({
    // Song validation will be handled by multer middleware
  })
}
