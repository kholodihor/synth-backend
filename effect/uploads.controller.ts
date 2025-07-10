import { Effect } from 'effect';
import { UploadedFile } from 'express-fileupload';
import cloudinary from '../libs/cloudinary';

/**
 * Effect-based controller for file uploads
 * This controller provides improved error handling and consistent responses
 */

// Types for upload responses
export interface UploadResponse {
  url: string;
  fileName?: string;
  publicId?: string;
}

// Error types
export class UploadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * Upload an image to Cloudinary
 */
export const uploadImage = (image: string, folder: string): Effect.Effect<UploadResponse, UploadError, never> => {
  return Effect.tryPromise({
    try: async () => {
      const result = await cloudinary.uploader.upload(image, {
        folder,
      });
      
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    },
    catch: (error) => new UploadError(`Failed to upload image to ${folder}`, error)
  });
};

/**
 * Upload a file to Cloudinary
 */
export const uploadFile = (file: UploadedFile, folder: string): Effect.Effect<UploadResponse, UploadError, never> => {
  return Effect.tryPromise({
    try: async () => {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder,
        resource_type: 'auto',
      });
      
      return {
        url: result.secure_url,
        fileName: file.name,
        publicId: result.public_id
      };
    },
    catch: (error) => new UploadError(`Failed to upload file to ${folder}`, error)
  });
};

/**
 * Upload a file to local storage
 */
export const uploadLocalFile = (file: Express.Multer.File): Effect.Effect<UploadResponse, UploadError, never> => {
  return Effect.try({
    try: () => {
      if (!file) {
        throw new Error('No file provided');
      }
      
      return {
        url: `/uploads/songs/topsongs/${file.originalname}`,
        fileName: file.originalname
      };
    },
    catch: (error) => new UploadError('Failed to process local file upload', error)
  });
};
