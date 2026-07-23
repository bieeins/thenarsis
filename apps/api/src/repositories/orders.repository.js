import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'orders';
const base = createBaseRepository(TABLE);

export const ordersRepository = {
  ...base,

  async findByIdExpanded(id) {
    const order = await db(TABLE).where({ id }).first();
    if (!order) return null;
    return this._expand(order);
  },

  async _expand(order) {
    const [product, designer] = await Promise.all([
      order.product_id ? db('products').where({ id: order.product_id }).first() : null,
      order.assigned_designer_id ? db('users').select('id', 'name', 'email', 'role').where({ id: order.assigned_designer_id }).first() : null,
    ]);
    return { ...order, product, assigned_designer: designer };
  },

  async list({ status, designerId, search, startDate, endDate, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);

    const applyFilters = (q) => {
      if (status) q.where({ status });
      if (designerId) q.where({ assigned_designer_id: designerId });
      if (startDate) q.where('event_date', '>=', startDate);
      if (endDate) q.where('event_date', '<=', endDate);
      if (search) {
        const like = `%${search.toLowerCase()}%`;
        q.where((sub) => sub
          .whereRaw('LOWER(customer_name) LIKE ?', [like])
          .orWhereRaw('LOWER(event_name) LIKE ?', [like])
          .orWhereRaw('LOWER(invoice_number) LIKE ?', [like]));
      }
    };

    applyFilters(query);
    applyFilters(countQuery);

    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);

    const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))];
    const designerIds = [...new Set(rows.map((r) => r.assigned_designer_id).filter(Boolean))];
    const [products, designers] = await Promise.all([
      productIds.length ? db('products').whereIn('id', productIds) : [],
      designerIds.length ? db('users').select('id', 'name', 'email', 'role').whereIn('id', designerIds) : [],
    ]);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const designerMap = new Map(designers.map((d) => [d.id, d]));
    const expandedRows = rows.map((row) => ({
      ...row,
      product: productMap.get(row.product_id) || null,
      assigned_designer: designerMap.get(row.assigned_designer_id) || null,
    }));

    return { rows: expandedRows, totalItems: Number(count) };
  },

  async findByCrewId(crewId) {
    return db(TABLE)
      .join('crew_assignments', 'crew_assignments.order_id', 'orders.id')
      .where('crew_assignments.crew_id', crewId)
      .select('orders.*');
  },
};
