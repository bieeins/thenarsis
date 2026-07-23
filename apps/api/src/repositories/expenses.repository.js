import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'expenses';
const base = createBaseRepository(TABLE);

export const expensesRepository = {
  ...base,

  async list({ category, startDate, endDate, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);
    const applyFilters = (q) => {
      if (category) q.where({ category });
      if (startDate) q.where('transaction_date', '>=', startDate);
      if (endDate) q.where('transaction_date', '<=', endDate);
    };
    applyFilters(query);
    applyFilters(countQuery);
    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows, totalItems: Number(count) };
  },
};
