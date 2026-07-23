import { badRequest } from '../utils/http-error.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.query = result.data;
    next();
  };
}

export function validateParams(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.params = result.data;
    next();
  };
}
