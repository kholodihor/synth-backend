import { Router } from 'express';
import { SongController } from '../controllers';
import { TopSongController } from '../controllers';
import { checkAuth } from '../middleware/checkAuth';
import { addSongValidation } from '../validations/SongValidation/songValidation';

const router = Router();

router.post('/songs', checkAuth, addSongValidation, SongController.addSong);
router.get('/:id/songs', checkAuth, SongController.getSongsByUser);
router.delete('/songs/:id', checkAuth, SongController.deleteSong);

router.post('/topsongs', TopSongController.addTopSong);
router.get('/topsongs', TopSongController.getTopSongs);

export default router;
