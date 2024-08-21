import { Router } from 'express';
import { checkAuth } from '../middleware/checkAuth';
import { UserController } from '../controllers';

const router = Router();

router.post('/user/login', UserController.loginUser);
router.post('/user/register', UserController.registerUser);
router.patch('/user', checkAuth, UserController.editUser);
router.get('/user', checkAuth, UserController.getUser);

export default router;
