import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'invoices';
const base = createBaseRepository(TABLE);

export const invoicesRepository = {
  ...base,

  async findByInvoiceNumber(invoiceNumber) {
    return db(TABLE).where({ invoice_number: invoiceNumber }).first();
  },

  async list({ search, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      query.whereRaw('LOWER(invoice_number) LIKE ?', [like]);
      countQuery.whereRaw('LOWER(invoice_number) LIKE ?', [like]);
    }
    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows, totalItems: Number(count) };
  },
};
