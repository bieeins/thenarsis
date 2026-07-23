import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'order_items';
const base = createBaseRepository(TABLE);

export const orderItemsRepository = {
  ...base,

  async listByOrderId(orderId, trx = db) {
    return trx(TABLE).where({ order_id: orderId });
  },
};
