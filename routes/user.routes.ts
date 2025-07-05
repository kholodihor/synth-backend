import { Router } from 'express';
import { checkAuth } from '../middleware/checkAuth';
import * as UserEffectController from '../controllers/user.effect.controller';
import { 
  loginUserValidation, 
  registerUserValidation, 
  editUserValidation 
} from '../validations/UserValidation/userValidation';

const router = Router();

// Apply validation middleware before controller handlers
router.post('/user/login', loginUserValidation, UserEffectController.loginUser);
router.post('/user/register', registerUserValidation, UserEffectController.registerUser);
router.patch('/user', checkAuth, editUserValidation, UserEffectController.editUser);
router.get('/user', checkAuth, UserEffectController.getUser);

export default router;