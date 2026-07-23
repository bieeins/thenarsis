import { env } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'refresh_token';

export function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    domain: env.cookie.domain,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    domain: env.cookie.domain,
    path: '/api/auth',
  });
}

export { REFRESH_COOKIE_NAME };
