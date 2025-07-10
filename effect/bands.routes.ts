import { Router } from 'express';
import * as BandController from './band.controller';
import { checkAuth } from '../middleware/checkAuth';
import { createBandValidation } from '../validations/BandValidation/bandValidation';

/**
 * Effect-based router for band operations
 * This router uses the Effect-based controller while maintaining
 * the same API endpoints and middleware as the original
 */
const router = Router();

router.get('/bands', BandController.getAllBands);
router.get('/bands/:id', BandController.getOneBand);
router.get('/user/bands', checkAuth, BandController.getBandsByUser);
router.patch('/bands/:id', checkAuth, BandController.editBand);
router.delete('/bands/:id', checkAuth, BandController.deleteBand);
router.post('/bands', checkAuth, createBandValidation, BandController.createBand);

export default router;
