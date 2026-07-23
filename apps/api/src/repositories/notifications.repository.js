import { db } from '../config/database.js';
import { newId } from '../utils/id.js';

const TABLE = 'notifications';

export const notificationsRepository = {
  async create(data) {
    const id = newId();
    await db(TABLE).insert({ id, ...data });
    return db(TABLE).where({ id }).first();
  },

  async listForUser(userId) {
    return db(TABLE).where({ user_id: userId }).orderBy('created_at', 'desc');
  },

  async findById(id) {
    return db(TABLE).where({ id }).first();
  },

  async markRead(id) {
    await db(TABLE).where({ id }).update({ is_read: true, updated_at: db.fn.now() });
    return this.findById(id);
  },

  async delete(id) {
    return db(TABLE).where({ id }).delete();
  },
};
