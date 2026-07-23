import { db } from '../config/database.js';

const TABLE = 'sessions';

export const sessionsRepository = {
  async create(data) {
    await db(TABLE).insert(data);
    return db(TABLE).where({ id: data.id }).first();
  },

  async findActiveById(id) {
    return db(TABLE)
      .where({ id })
      .whereNull('revoked_at')
      .where('expires_at', '>', db.fn.now())
      .first();
  },

  async revoke(id) {
    return db(TABLE).where({ id }).update({ revoked_at: db.fn.now() });
  },

  async revokeAllForUser(userId) {
    return db(TABLE).where({ user_id: userId }).whereNull('revoked_at').update({ revoked_at: db.fn.now() });
  },
};
