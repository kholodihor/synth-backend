import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

const validator = (
  schema: Joi.ObjectSchema,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.body);
  if (error) {
    res.status(422).json({ success: false, message: error.details[0].message });
    return;
  }
  next();
};

export default validator;
