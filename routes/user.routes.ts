import { Router } from 'express';
import { checkAuth } from '../middleware/checkAuth';
import { UserController } from '../controllers';
import {
  registerUserValidation,
  loginUserValidation,
  editUserValidation,
} from '../validations/UserValidation/userValidation';

const router = Router();

router.post('/user/login', loginUserValidation, UserController.loginUser);
router.post('/user/register', registerUserValidation, UserController.registerUser);
router.patch('/user', checkAuth, editUserValidation, UserController.editUser);
router.get('/user', checkAuth, UserController.getUser);

export default router;
