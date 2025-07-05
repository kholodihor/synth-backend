import { Router } from 'express';
import * as BandEffectController from '../controllers/band.effect.controller';
import { checkAuth } from '../middleware/checkAuth';
import { createBandValidation } from '../validations/BandValidation/bandValidation';

const router = Router();

router.get('/bands', BandEffectController.getAllBands);
router.get('/bands/:id', BandEffectController.getOneBand);
router.get('/user/bands', checkAuth, BandEffectController.getBandsByUser);
router.patch('/bands/:id', checkAuth, BandEffectController.editBand);
router.delete('/bands/:id', checkAuth, BandEffectController.deleteBand);
router.post('/bands', checkAuth, createBandValidation, BandEffectController.createBand);

export default router;