import { notificationsRepository } from '../repositories/notifications.repository.js';
import { forbidden, notFound } from '../utils/http-error.js';

export const notificationsResourceService = {
  async listForUser(userId) {
    return notificationsRepository.listForUser(userId);
  },

  async create(data, requester) {
    return notificationsRepository.create({ ...data, user_id: data.user_id || requester.id });
  },

  async markRead(id, requester) {
    const record = await notificationsRepository.findById(id);
    if (!record) throw notFound('Notification not found');
    if (record.user_id !== requester.id) throw forbidden();
    return notificationsRepository.markRead(id);
  },

  async remove(id, requester) {
    const record = await notificationsRepository.findById(id);
    if (!record) throw notFound('Notification not found');
    if (record.user_id !== requester.id) throw forbidden();
    await notificationsRepository.delete(id);
  },
};
