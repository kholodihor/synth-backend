import { RequestHandler } from 'express';
import { userSchema } from './userSchema';
import validator from '../validator';

export const registerUserValidation: RequestHandler = (req, res, next) => {
  validator(userSchema.registerUser, req.body, next);
};
export const loginUserValidation: RequestHandler = (req, res, next) => {
  validator(userSchema.loginUser, req.body, next);
};
export const editUserValidation: RequestHandler = (req, res, next) => {
  validator(userSchema.editUser, req.body, next);
};
