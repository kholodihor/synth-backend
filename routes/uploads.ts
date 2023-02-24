import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';

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

router.post('/uploadavatar', upload.single('avatar'), (req, res) => {
  res.json({
    url: `/uploads/images/users/${req?.file?.originalname}`,
  });
});

router.post(
  '/uploadbandimage',
  upload.single('band'),
  (req, res) => {
    res.json({
      url: `/uploads/images/bands/${req?.file?.originalname}`,
    });
  }
);

router.post('/uploadsong', upload.single('song'), (req, res) => {
  res.json({
    url: `/uploads/songs/${req?.file?.originalname}`,
    fileName: req?.file?.originalname,
  });
});

router.post('/uploadtopsong', upload.single('topsong'), (req, res) => {
  res.json({
    url: `/uploads/songs/topsongs/${req?.file?.originalname}`,
    fileName: req?.file?.originalname,
  });
});

export default router;
