import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'products';
const base = createBaseRepository(TABLE);

export const productsRepository = {
  ...base,

  async list({ search, category, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);

    if (category) {
      query.where({ category });
      countQuery.where({ category });
    }
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      query.whereRaw('LOWER(package_name) LIKE ?', [like]);
      countQuery.whereRaw('LOWER(package_name) LIKE ?', [like]);
    }

    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows, totalItems: Number(count) };
  },
};
