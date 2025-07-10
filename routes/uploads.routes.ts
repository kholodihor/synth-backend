import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import * as UploadsController from '../controllers/uploads.controller';

const router = Router();

// Create directories if they don't exist
const createDirectoryIfNotExists = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

// Configure multer storage for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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

// Define routes with controller methods
router.post('/uploadavatar', UploadsController.uploadAvatar);
router.post('/uploadbandimage', UploadsController.uploadBandImage);
router.post('/uploadsong', UploadsController.uploadSong);
router.post('/uploadtopsong', upload.single('topsong'), UploadsController.uploadTopSong);

export default router;
