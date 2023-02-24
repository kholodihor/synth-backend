import { Router } from 'express';
import { VideoController } from '../controllers';
import { checkAuth } from '../middleware/checkAuth';
import { addVideoValidation } from '../validations/VideoValidation/videoValidation';

const router = Router();

router.post('/video',checkAuth, addVideoValidation, VideoController.addVideo);
router.get('/video', VideoController.getAllVideos);
router.get('/user/video', checkAuth, VideoController.getVideosByUser);
router.delete('/video/:id', checkAuth, VideoController.deleteVideo);


export default router;
