import { Router } from 'express';
import * as SongEffectController from '../controllers/song.effect.controller';
import * as TopSongEffectController from '../controllers/topsong.effect.controller';
import { checkAuth } from '../middleware/checkAuth';
import { addSongValidation } from '../validations/SongValidation/songValidation';

const router = Router();

router.post('/songs', checkAuth, addSongValidation, SongEffectController.addSong);
router.get('/user/songs', checkAuth, SongEffectController.getSongsByUser); // Route for current user's songs
router.get('/:id/songs', checkAuth, SongEffectController.getSongsByUser); // Route for specific user's songs
router.delete('/songs/:id', checkAuth, SongEffectController.deleteSong);

router.post('/topsongs', TopSongEffectController.addTopSong);
router.get('/topsongs', TopSongEffectController.getTopSongs);

export default router;