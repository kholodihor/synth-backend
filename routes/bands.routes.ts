import { Router } from 'express';
import { BandController } from '../controllers';
import { checkAuth } from '../middleware/checkAuth';
import { createBandValidation } from '../validations/BandValidation/bandValidation';

const router = Router();

router.get('/bands', BandController.getAllBands);
router.get('/bands-paginate', BandController.getAllBandsPaginate);
router.get('/bands/:id', BandController.getOneBand);
router.get('/user/bands', checkAuth, BandController.getBandsByUser);
router.patch('/bands/:id', checkAuth, BandController.editBand);
router.delete('/bands/:id', checkAuth, BandController.deleteBand);
router.post('/bands',checkAuth,createBandValidation,BandController.createBand);


export default router;
