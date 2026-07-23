import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'notes';
const base = createBaseRepository(TABLE);

export const notesRepository = {
  ...base,

  async listByOrderId(orderId) {
    return db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc');
  },
};
