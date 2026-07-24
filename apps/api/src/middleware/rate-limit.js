import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.limit,

  // Login/register have their own stricter limiter. They must not inherit a
  // user's exhausted general API quota, otherwise a legitimate user cannot
  // sign back in after navigating through a request-heavy dashboard.
  skip: (req) => req.path === '/auth/login' || req.path === '/auth/register',

  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba kembali.',
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,

  // 20 gagal login dalam 5 menit masih cukup ketat.
  limit: env.rateLimit.loginLimit,

  // Login yang berhasil tidak perlu dihitung sebagai percobaan berbahaya.
  skipSuccessfulRequests: true,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Tunggu 5 menit lalu coba kembali.',
  },
});
