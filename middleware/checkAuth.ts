import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  _id: string;
}

export const checkAuth = (req:Request, res:Response, next:NextFunction) => {
  const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
      req.userId = decoded._id;
      next();
    } catch (e) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }
  } else {
    return res.status(403).json({
      message: 'Access denied',
    });
  }
};
