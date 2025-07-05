import { userSchema } from './userSchema';
import { validationMiddleware } from '../validator';

/**
 * Validation middleware for user registration
 * Validates username, email, and password according to schema rules
 */
export const registerUserValidation = validationMiddleware(userSchema.registerUser);

/**
 * Validation middleware for user login
 * Validates email and password according to schema rules
 */
export const loginUserValidation = validationMiddleware(userSchema.loginUser);

/**
 * Validation middleware for user profile editing
 * Validates username and avatarUrl according to schema rules
 */
export const editUserValidation = validationMiddleware(userSchema.editUser);
