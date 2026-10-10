import { Router } from 'express';
import * as UploadsController from '../controllers/uploads.controller';
import { checkAuth } from '../middleware/checkAuth';

const router = Router();

router.post('/uploadavatar', checkAuth, UploadsController.uploadAvatar);
router.post('/uploadbandimage', checkAuth, UploadsController.uploadBandImage);
router.post('/uploadsong', checkAuth, UploadsController.uploadSong);
router.post('/uploadtopsong', checkAuth, UploadsController.uploadTopSong);

export default router;
