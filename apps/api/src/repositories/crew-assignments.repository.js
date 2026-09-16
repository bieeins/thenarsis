import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'crew_assignments';
const base = createBaseRepository(TABLE);

async function expandRows(rows) {
  const orderIds = [...new Set(rows.map((r) => r.order_id).filter(Boolean))];
  const userIds = [...new Set([
    ...rows.map((r) => r.crew_id),
    ...rows.map((r) => r.assigned_by),
  ].filter(Boolean))];

  const [orders, users] = await Promise.all([
    orderIds.length ? db('orders').whereIn('id', orderIds) : [],
    userIds.length ? db('users').select('id', 'name', 'email', 'role').whereIn('id', userIds) : [],
  ]);

  const productIds = [...new Set(orders.map((o) => o.product_id).filter(Boolean))];
  const products = productIds.length ? await db('products').whereIn('id', productIds) : [];
  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderMap = new Map(orders.map((o) => [o.id, { ...o, product: productMap.get(o.product_id) || null }]));

  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows.map((row) => ({
    ...row,
    order: orderMap.get(row.order_id) || null,
    crew: userMap.get(row.crew_id) || null,
    assigned_by_user: row.assigned_by ? userMap.get(row.assigned_by) || null : null,
  }));
}

export const crewAssignmentsRepository = {
  ...base,

  async list({ crewId, orderId, status, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE);
    const countQuery = db(TABLE);
    const applyFilters = (q) => {
      if (crewId) q.where({ crew_id: crewId });
      if (orderId) q.where({ order_id: orderId });
      if (status) q.where({ status });
    };
    applyFilters(query);
    applyFilters(countQuery);
    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows: await expandRows(rows), totalItems: Number(count) };
  },

  async findByIdExpanded(id) {
    const record = await db(TABLE).where({ id }).first();
    if (!record) return null;
    const [expanded] = await expandRows([record]);
    return expanded;
  },
};
