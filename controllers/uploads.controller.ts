import { RequestHandler } from 'express';
import { Effect } from 'effect';
import { UploadedFile } from 'express-fileupload';
import cloudinary from '../libs/cloudinary';

/**
 * Controller for handling file uploads
 * Uses Effect for better error handling and functional composition
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
const uploadImageToCloudinary = (image: string, folder: string): Effect.Effect<UploadResponse, UploadError, never> => {
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
    catch: (error) => new UploadError(`Failed to upload image to ${folder}: ${error}`)
  });
};

/**
 * Upload a file to Cloudinary
 */
const uploadFileToCloudinary = (file: UploadedFile, folder: string): Effect.Effect<UploadResponse, UploadError, never> => {
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
    catch: (error) => new UploadError(`Failed to upload file to ${folder}: ${error}`)
  });
};

/**
 * Process a local file upload
 */
const processLocalFile = (file: Express.Multer.File): Effect.Effect<UploadResponse, UploadError, never> => {
  return Effect.try({
    try: () => {
      if (!file) {
        throw new UploadError('No file provided');
      }
      
      return {
        url: `/uploads/songs/topsongs/${file.originalname}`,
        fileName: file.originalname
      };
    },
    catch: (error) => new UploadError(`Failed to process local file: ${error}`)
  });
};

/**
 * Upload avatar image
 */
export const uploadAvatar: RequestHandler = async (req, res) => {
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ 
      success: false,
      message: 'No image provided' 
    });
  }

  type UploadResult = 
    | { success: true; data: UploadResponse }
    | { success: false; error: string };

  try {
    const result = await Effect.runPromise(
      Effect.match(uploadImageToCloudinary(image, 'users'), {
        onSuccess: (data): UploadResult => ({ success: true, data }),
        onFailure: (error): UploadResult => {
          console.error('Upload error:', error);
          return { success: false, error: error.message };
        }
      })
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      url: result.data.url,
      publicId: result.data.publicId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload avatar'
    });
  }
};

/**
 * Upload band image
 */
export const uploadBandImage: RequestHandler = async (req, res) => {
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ 
      success: false,
      message: 'No image provided' 
    });
  }

  type UploadResult = 
    | { success: true; data: UploadResponse }
    | { success: false; error: string };

  try {
    const result = await Effect.runPromise(
      Effect.match(uploadImageToCloudinary(image, 'bands'), {
        onSuccess: (data): UploadResult => ({ success: true, data }),
        onFailure: (error): UploadResult => {
          console.error('Upload error:', error);
          return { success: false, error: error.message };
        }
      })
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      url: result.data.url,
      publicId: result.data.publicId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload band image'
    });
  }
};

/**
 * Upload song file
 */
export const uploadSong: RequestHandler = async (req, res) => {
  if (!req.files || !req.files.song) {
    return res.status(400).json({ 
      success: false,
      message: 'No song file provided' 
    });
  }

  type UploadResult = 
    | { success: true; data: UploadResponse }
    | { success: false; error: string };

  try {
    const file = req.files.song as UploadedFile;
    
    const result = await Effect.runPromise(
      Effect.match(uploadFileToCloudinary(file, 'music'), {
        onSuccess: (data): UploadResult => ({ success: true, data }),
        onFailure: (error): UploadResult => {
          console.error('Upload error:', error);
          return { success: false, error: error.message };
        }
      })
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      url: result.data.url,
      fileName: result.data.fileName,
      publicId: result.data.publicId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload song'
    });
  }
};

/**
 * Upload top song file (local storage)
 */
export const uploadTopSong: RequestHandler = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: 'No song file provided' 
    });
  }
  
  type UploadResult = 
    | { success: true; data: UploadResponse }
    | { success: false; error: string };

  try {
    const result = Effect.runSync(
      Effect.match(
        processLocalFile(req.file),
        {
          onSuccess: (data): UploadResult => ({ success: true, data }),
          onFailure: (error): UploadResult => {
            console.error('File processing error:', error);
            return { success: false, error: error.message };
          }
        }
      )
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      url: result.data.url,
      fileName: result.data.fileName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process top song'
    });
  }
};
