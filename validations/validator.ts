import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationError {
  message: string;
  field?: string;
  success: boolean;
}

/**
 * Enhanced validator middleware that returns standardized error responses
 * with field information for better frontend handling
 */
const validator = (
  schemaName: Joi.ObjectSchema,
  body: object,
  next: NextFunction
) => {
  const { error } = schemaName.validate(body, { abortEarly: false });

  if (error) {
    const validationError: ValidationError = {
      message: error.details[0].message,
      field: error.details[0].path[0]?.toString(),
      success: false
    };

    // Return a 422 Unprocessable Entity status with the validation error
    return next({
      status: 422,
      validationError
    });
  }

  return next();
};

/**
 * Express middleware wrapper for the validator
 */
export const validationMiddleware = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validator(schema, req.body, (err: any) => {
        if (err) {
          return res.status(err.status || 422).json(err.validationError);
        }
        next();
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        message: 'Internal server error during validation',
        success: false
      });
    }
  };
};

export default validator;
