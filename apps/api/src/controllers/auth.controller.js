import { authService } from '../services/auth.service.js';
import { ok, created } from '../utils/response.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie, REFRESH_COOKIE_NAME } from '../utils/cookies.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      setRefreshTokenCookie(res, refreshToken);
      ok(res, { user, accessToken });
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body, req.user);
      setRefreshTokenCookie(res, refreshToken);
      created(res, { user, accessToken });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      const { user, accessToken, refreshToken } = await authService.refresh(token);
      setRefreshTokenCookie(res, refreshToken);
      ok(res, { user, accessToken });
    } catch (err) {
      clearRefreshTokenCookie(res);
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.logout(token);
      clearRefreshTokenCookie(res);
      ok(res, { loggedOut: true });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user.id);
      ok(res, user);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      clearRefreshTokenCookie(res);
      ok(res, { changed: true });
    } catch (err) {
      next(err);
    }
  },
};
