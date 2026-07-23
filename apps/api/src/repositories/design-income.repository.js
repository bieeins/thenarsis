import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'design_income';
const base = createBaseRepository(TABLE);

export const designIncomeRepository = {
  ...base,

  async list({ designerId, status, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);
    const applyFilters = (q) => {
      if (designerId) q.where({ designer_id: designerId });
      if (status) q.where({ status });
    };
    applyFilters(query);
    applyFilters(countQuery);
    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows, totalItems: Number(count) };
  },
};
