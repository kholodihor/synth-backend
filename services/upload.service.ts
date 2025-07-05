import { Effect } from 'effect';
import cloudinary from '../libs/cloudinary';

// Define error types for better error handling
export class UploadError extends Error {
  readonly _tag = 'UploadError';
  constructor(message: string = 'Failed to upload file') {
    super(message);
  }
}

export class FileNotProvidedError extends Error {
  readonly _tag = 'FileNotProvidedError';
  constructor(message: string = 'No file provided') {
    super(message);
  }
}

// Define a more flexible file type to handle different file formats
type UploadableFile = string | { tempFilePath?: string } | any;

// Define proper Cloudinary option types
type CloudinaryResourceType = 'auto' | 'image' | 'video' | 'raw';

interface CloudinaryUploadOptions {
  folder: string;
  resource_type?: CloudinaryResourceType;
}

// Effect-based upload to cloudinary
export const uploadToCloudinary = (
  file: UploadableFile,
  options: CloudinaryUploadOptions
) => {
  return Effect.gen(function* (_) {
    // Check if file is provided
    if (!file) {
      // Using yield for error handling
      yield* _(Effect.fail(new FileNotProvidedError()));
      return {}; // This line is never reached due to the yield* above
    }

    try {
      // Handle different file types
      let fileToUpload: string;

      if (typeof file === 'string') {
        fileToUpload = file;
      } else if (file.tempFilePath) {
        fileToUpload = file.tempFilePath;
      } else if (Array.isArray(file) && file[0]?.tempFilePath) {
        fileToUpload = file[0].tempFilePath;
      } else {
        yield* _(Effect.fail(new UploadError('Invalid file format')));
        return {}; // This line is never reached
      }

      // Upload to cloudinary
      const result = yield* _(Effect.tryPromise({
        try: () => cloudinary.uploader.upload(fileToUpload, options),
        catch: (error) => new UploadError(`Cloudinary upload failed: ${error}`)
      }));

      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      // This catch block is for any unexpected errors
      yield* _(Effect.fail(new UploadError(`Unexpected error: ${error}`)));
      return {}; // This line is never reached due to the yield* above
    }
  });
};

// Specific upload functions for different types
export const uploadAvatar = (image: string) => {
  return uploadToCloudinary(image, { folder: 'users' });
};

export const uploadBandImage = (image: string) => {
  return uploadToCloudinary(image, { folder: 'bands' });
};

export const uploadSong = (file: any) => {
  return uploadToCloudinary(file, {
    folder: 'music',
    resource_type: 'auto' as CloudinaryResourceType
  });
};