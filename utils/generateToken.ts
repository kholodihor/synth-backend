import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const generateToken = (uid: Types.ObjectId) => {
  return jwt.sign({ _id: uid }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};
