import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { HttpError } from '../utils/http-error.js';

export function errorHandler(err, req, res, _next) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = status === 500 && env.isProduction
    ? 'An unexpected error occurred'
    : err.message || 'An unexpected error occurred';

  logger.error({
    err: { message: err.message, stack: env.isProduction ? undefined : err.stack },
    requestId: req.id,
    path: req.path,
    method: req.method,
  }, 'request_error');

  res.status(status).json({
    success: false,
    message,
    ...(err instanceof HttpError && err.errors ? { errors: err.errors } : {}),
  });
}
