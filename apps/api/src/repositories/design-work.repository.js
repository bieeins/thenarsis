import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'design_work';
const base = createBaseRepository(TABLE);

async function expandRows(rows) {
  const orderIds = [...new Set(rows.map((r) => r.order_id).filter(Boolean))];
  const designerIds = [...new Set(rows.map((r) => r.designer_id).filter(Boolean))];
  const [orders, designers] = await Promise.all([
    orderIds.length ? db('orders').whereIn('id', orderIds) : [],
    designerIds.length ? db('users').select('id', 'name', 'email', 'role').whereIn('id', designerIds) : [],
  ]);

  const productIds = [...new Set(orders.map((o) => o.product_id).filter(Boolean))];
  const products = productIds.length ? await db('products').whereIn('id', productIds) : [];
  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderMap = new Map(orders.map((o) => [o.id, { ...o, product: productMap.get(o.product_id) || null }]));

  const designerMap = new Map(designers.map((d) => [d.id, d]));
  return rows.map((row) => ({
    ...row,
    order: orderMap.get(row.order_id) || null,
    designer: designerMap.get(row.designer_id) || null,
  }));
}

export const designWorkRepository = {
  ...base,

  async list({ designerId, orderId, status, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);
    const applyFilters = (q) => {
      if (designerId) q.where({ designer_id: designerId });
      if (orderId) q.where({ order_id: orderId });
      if (status) q.where({ status });
    };
    applyFilters(query);
    applyFilters(countQuery);
    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows: await expandRows(rows), totalItems: Number(count) };
  },

  async listByOrderIds(orderIds) {
    if (orderIds.length === 0) return [];
    return db(TABLE).whereIn('order_id', orderIds);
  },

  async findByIdExpanded(id) {
    const record = await db(TABLE).where({ id }).first();
    if (!record) return null;
    const [expanded] = await expandRows([record]);
    return expanded;
  },
};
