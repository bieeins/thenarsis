import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,

  // 20 gagal login dalam 5 menit masih cukup ketat.
  limit: 20,

  // Login yang berhasil tidak perlu dihitung sebagai percobaan berbahaya.
  skipSuccessfulRequests: true,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Tunggu 5 menit lalu coba kembali.',
  },
});