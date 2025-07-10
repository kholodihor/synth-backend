import { Router } from 'express';
import { Effect } from 'effect';
import multer from 'multer';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import * as UploadsController from './uploads.controller';
import { UploadResponse } from './uploads.controller';

const router = Router();

// Configure multer storage for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directories if they don't exist
    const createDirectoryIfNotExists = (path: string) => {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    };

    createDirectoryIfNotExists('uploads');
    
    if (file.fieldname === 'avatar') {
      createDirectoryIfNotExists('uploads/images/users');
      cb(null, 'uploads/images/users');
    } else if (file.fieldname === 'band') {
      createDirectoryIfNotExists('uploads/images/bands');
      cb(null, 'uploads/images/bands');
    } else if (file.fieldname === 'song') {
      createDirectoryIfNotExists('uploads/songs');
      cb(null, 'uploads/songs');
    } else if (file.fieldname === 'topsong') {
      createDirectoryIfNotExists('uploads/songs/topsongs');
      cb(null, 'uploads/songs/topsongs');
    } else {
      cb(new Error(`Unsupported field name: ${file.fieldname}`), '');
    }
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

/**
 * Upload avatar image to Cloudinary
 */
router.post('/uploadavatar', async (req, res) => {
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ 
      success: false,
      message: 'No image provided' 
    });
  }

  const program = UploadsController.uploadImage(image, 'users');
  
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (data: UploadResponse) => data,
      onFailure: (error) => {
        console.error('Upload error:', error);
        return { error: error.message };
      }
    })
  );

  if ('error' in result) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    url: result.url as string,
    publicId: result.publicId as string
  });
});

/**
 * Upload band image to Cloudinary
 */
router.post('/uploadbandimage', async (req, res) => {
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ 
      success: false,
      message: 'No image provided' 
    });
  }

  const program = UploadsController.uploadImage(image, 'bands');
  
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (data: UploadResponse) => data,
      onFailure: (error) => {
        console.error('Upload error:', error);
        return { error: error.message };
      }
    })
  );

  if ('error' in result) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    url: result.url as string,
    publicId: result.publicId as string
  });
});

/**
 * Upload song file to Cloudinary
 */
router.post('/uploadsong', async (req, res) => {
  if (!req.files || !req.files.song) {
    return res.status(400).json({ 
      success: false,
      message: 'No song file provided' 
    });
  }

  const file = req.files.song as UploadedFile;
  const program = UploadsController.uploadFile(file, 'music');
  
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (data: UploadResponse) => data,
      onFailure: (error) => {
        console.error('Upload error:', error);
        return { error: error.message };
      }
    })
  );

  if ('error' in result) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    url: result.url as string,
    fileName: result.fileName as string,
    publicId: result.publicId as string
  });
});

/**
 * Upload top song file to local storage
 */
router.post('/uploadtopsong', upload.single('topsong'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: 'No song file provided' 
    });
  }

  const program = UploadsController.uploadLocalFile(req.file);
  
  const result = await Effect.runPromise(
    Effect.match(program, {
      onSuccess: (data: UploadResponse) => data,
      onFailure: (error) => {
        console.error('Upload error:', error);
        return { error: error.message };
      }
    })
  );

  if ('error' in result) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    url: result.url,
    fileName: result.fileName
  });
});

export default router;
