import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { usersRepository, USERS_PUBLIC_COLUMNS } from '../repositories/users.repository.js';
import { sessionsRepository } from '../repositories/sessions.repository.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { newId } from '../utils/id.js';
import { badRequest, conflict, unauthorized } from '../utils/http-error.js';
import { env } from '../config/env.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

const BCRYPT_ROUNDS = 12;
const ALLOWED_ROLES = ['owner', 'designer', 'crew', 'design_reviewer'];

function toPublicUser(user) {
  const result = {};
  for (const key of USERS_PUBLIC_COLUMNS) result[key] = user[key];
  return result;
}

function refreshExpiryDate() {
  const match = /^(\d+)([smhd])$/.exec(env.jwt.refreshExpiresIn);
  const amount = match ? Number(match[1]) : 7;
  const unit = match ? match[2] : 'd';
  const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return new Date(Date.now() + amount * multiplier);
}

async function createSession(userId) {
  const sessionId = newId();
  const user = await usersRepository.findById(userId);
  const refreshToken = signRefreshToken(user, sessionId);
  const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

  await sessionsRepository.create({
    id: sessionId,
    user_id: userId,
    refresh_token_hash: refreshTokenHash,
    expires_at: refreshExpiryDate(),
  });

  return { refreshToken, accessToken: signAccessToken(user) };
}

export const authService = {
  async login(email, password) {
    const user = await usersRepository.findByEmail(email);
    if (!user) throw unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw unauthorized('Invalid email or password');

    if (!ALLOWED_ROLES.includes(user.role)) throw unauthorized('Invalid email or password');

    const tokens = await createSession(user.id);
    return { user: toPublicUser(user), ...tokens };
  },

  async register({ email, password, name, role, phone }, requester) {
    const isBootstrap = (await db('users').count({ count: '*' }).first()).count === 0;
    if (!isBootstrap && (!requester || requester.role !== 'owner')) {
      throw unauthorized('Only an owner can create new accounts');
    }

    const existing = await usersRepository.findByEmail(email);
    if (existing) throw conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await usersRepository.create({
      id: newId(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      role: isBootstrap ? 'owner' : role,
      phone: phone || null,
      verified: true,
    });

    notificationService.sendWelcomeEmail(user).catch((err) => {
      logger.error({ err }, 'welcome_email_failed');
    });

    const tokens = await createSession(user.id);
    return { user: toPublicUser(user), ...tokens };
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw unauthorized('Session expired, please log in again');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Session expired, please log in again');
    }

    const session = await sessionsRepository.findActiveById(payload.sid);
    if (!session) throw unauthorized('Session expired, please log in again');

    const matches = await bcrypt.compare(refreshToken, session.refresh_token_hash);
    if (!matches) {
      // possible token reuse — revoke the whole session family defensively
      await sessionsRepository.revoke(session.id);
      throw unauthorized('Session expired, please log in again');
    }

    await sessionsRepository.revoke(session.id);

    const user = await usersRepository.findById(session.user_id);
    if (!user) throw unauthorized('Session expired, please log in again');

    const tokens = await createSession(user.id);
    return { user: toPublicUser(user), ...tokens };
  },

  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      await sessionsRepository.revoke(payload.sid);
    } catch {
      // token already invalid — nothing to revoke
    }
  },

  async me(userId) {
    const user = await usersRepository.findPublicById(userId);
    if (!user) throw unauthorized();
    return user;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await usersRepository.findById(userId);
    if (!user) throw unauthorized();

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw badRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await usersRepository.update(userId, { password_hash: passwordHash });
    await sessionsRepository.revokeAllForUser(userId);
  },

  toPublicUser,
};
