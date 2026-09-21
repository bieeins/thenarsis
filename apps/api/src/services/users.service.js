import bcrypt from 'bcrypt';
import { usersRepository } from '../repositories/users.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { conflict, forbidden, notFound } from '../utils/http-error.js';
import { newId } from '../utils/id.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';
import { sessionsRepository } from '../repositories/sessions.repository.js';

const SORTABLE_FIELDS = ['created_at', 'name', 'email', 'role'];
const BCRYPT_ROUNDS = 12;

export const usersService = {
  async list(query) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const { rows, totalItems } = await usersRepository.list({
      role: query.role, search: query.search, page, perPage, offset, sortField: field, sortOrder: order,
    });
    return { rows, page, perPage, totalItems };
  },

  async get(id, requester) {
    if (requester && requester.role !== 'owner' && requester.id !== id) throw forbidden();
    const user = await usersRepository.findPublicById(id);
    if (!user) throw notFound('User not found');
    return user;
  },

  async create(data) {
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) throw conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await usersRepository.create({
      id: newId(),
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      name: data.name,
      role: data.role,
      phone: data.phone || null,
      verified: true,
    });

    notificationService.sendWelcomeEmail(user).catch((err) => {
      logger.error({ err }, 'welcome_email_failed');
    });

    return usersRepository.findPublicById(user.id);
  },

  async update(id, data, requester) {
    if (requester.role !== 'owner' && requester.id !== id) throw forbidden();
    if (requester.role !== 'owner' && data.role) throw forbidden('Only an owner can change roles');
    await this.get(id);
    await usersRepository.update(id, data);
    return usersRepository.findPublicById(id);
  },

  // Owner-initiated reset for a team member who forgot/changed their password.
  // Revokes the member's existing sessions so the old credentials stop working
  // everywhere (the owner's own session is left alone if they reset themselves).
  async resetPassword(id, newPassword, requester) {
    await this.get(id);
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await usersRepository.update(id, { password_hash: passwordHash });
    if (id !== requester.id) await sessionsRepository.revokeAllForUser(id);
  },

  async remove(id, requester) {
    if (requester.id === id) throw forbidden('You cannot delete your own account');
    await this.get(id);
    await usersRepository.delete(id);
  },
};
