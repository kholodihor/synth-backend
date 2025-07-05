import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import * as UploadEffectController from '../controllers/upload.effect.controller';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    if (file.fieldname === 'avatar') {
      cb(null, 'uploads/images/users');
    } else if (file.fieldname === 'band') {
      cb(null, 'uploads/images/bands');
    } else if (file.fieldname === 'song') {
      cb(null, 'uploads/songs');
    } else if (file.fieldname === 'topsong') {
      cb(null, 'uploads/songs/topsongs');
    }
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Import validation middleware
import {
  uploadAvatarValidation,
  uploadBandImageValidation
} from '../validations/UploadValidation/uploadValidation';

// Use Effect-based controllers for uploads with validation
router.post('/uploadavatar', uploadAvatarValidation, UploadEffectController.uploadAvatar);
router.post('/uploadbandimage', uploadBandImageValidation, UploadEffectController.uploadBandImage);
// For song uploads, we still use multer since it's a file upload
router.post('/uploadsong', upload.single('song'), UploadEffectController.uploadSong);

// Keep the original implementation for top song upload as it uses local storage
router.post('/uploadtopsong', upload.single('topsong'), (req, res) => {
  res.json({
    url: `/uploads/songs/topsongs/${req?.file?.originalname}`,
    fileName: req?.file?.originalname,
  });
});

export default router;