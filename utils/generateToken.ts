import jwt from 'jsonwebtoken';

export const generateToken = (uid: any) => {
  return jwt.sign({ uid }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

