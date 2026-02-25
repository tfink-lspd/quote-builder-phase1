import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { errors } from './error.middleware';
import { logger } from '../../utils/logger';

export type ValidationSource = 'body' | 'params' | 'query';

/**
 * Middleware to validate request data against a Joi schema
 */
export function validate(schema: Joi.Schema, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error', {
        source,
        errors: details,
        data
      });

      throw errors.validation('Validation failed', details);
    }

    // Replace request data with validated and sanitized value
    req[source] = value;
    next();
  };
}
