import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});
