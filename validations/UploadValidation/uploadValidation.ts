import { uploadSchema } from './uploadSchema';
import { validationMiddleware } from '../validator';

/**
 * Validation middleware for avatar uploads
 * Validates that the image is provided and is a valid base64 string
 */
export const uploadAvatarValidation = validationMiddleware(uploadSchema.uploadAvatar);

/**
 * Validation middleware for band image uploads
 * Validates that the image is provided and is a valid base64 string
 */
export const uploadBandImageValidation = validationMiddleware(uploadSchema.uploadBandImage);

/**
 * Validation middleware for song uploads
 * Currently minimal as song uploads use multer middleware
 */
export const uploadSongValidation = validationMiddleware(uploadSchema.uploadSong);
