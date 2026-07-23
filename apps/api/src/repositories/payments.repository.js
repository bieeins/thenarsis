import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'payments';
const base = createBaseRepository(TABLE);

export const paymentsRepository = {
  ...base,

  async listByInvoiceId(invoiceId, trx = db) {
    return trx(TABLE).where({ invoice_id: invoiceId });
  },

  async list({ status, invoiceId, startDate, endDate, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);
    const applyFilters = (q) => {
      if (status) q.where({ payment_status: status });
      if (invoiceId) q.where({ invoice_id: invoiceId });
      if (startDate) q.where('payment_date', '>=', startDate);
      if (endDate) q.where('payment_date', '<=', endDate);
    };
    applyFilters(query);
    applyFilters(countQuery);
    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows, totalItems: Number(count) };
  },
};
