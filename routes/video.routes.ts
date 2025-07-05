import { Router } from 'express';
import * as VideoEffectController from '../controllers/video.effect.controller';
import { checkAuth } from '../middleware/checkAuth';
import { addVideoValidation } from '../validations/VideoValidation/videoValidation';

const router = Router();

router.post('/video', checkAuth, addVideoValidation, VideoEffectController.addVideo);
router.get('/video', VideoEffectController.getAllVideos);
router.get('/user/video', checkAuth, VideoEffectController.getVideosByUser);
router.delete('/video/:id', checkAuth, VideoEffectController.deleteVideo);

export default router;