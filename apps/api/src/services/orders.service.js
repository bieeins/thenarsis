import { db } from '../config/database.js';
import { ordersRepository } from '../repositories/orders.repository.js';
import { orderItemsRepository } from '../repositories/order-items.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { forbidden, notFound } from '../utils/http-error.js';
import { newId } from '../utils/id.js';

const SORTABLE_FIELDS = ['created_at', 'event_date', 'customer_name', 'status'];

function canViewAny(user) {
  return ['owner', 'design_reviewer', 'crew'].includes(user.role);
}

function canView(user, order) {
  return canViewAny(user) || order.assigned_designer_id === user.id;
}

export const ordersService = {
  async list(query, requester) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);

    const filters = {
      status: query.status, search: query.search, startDate: query.startDate, endDate: query.endDate,
      page, perPage, offset, sortField: field, sortOrder: order,
    };
    if (!canViewAny(requester)) {
      filters.designerId = requester.id;
    } else if (query.designerId) {
      filters.designerId = query.designerId;
    }

    const { rows, totalItems } = await ordersRepository.list(filters);
    return { rows, page, perPage, totalItems };
  },

  async get(id, requester) {
    const order = await ordersRepository.findByIdExpanded(id);
    if (!order) throw notFound('Order not found');
    if (!canView(requester, order)) throw forbidden();
    return order;
  },

  async create({ items, ...orderData }) {
    return db.transaction(async (trx) => {
      const orderId = newId();
      await trx('orders').insert({ id: orderId, ...orderData });

      for (const item of items) {
        await trx('order_items').insert({ id: newId(), order_id: orderId, ...item });
      }

      return trx('orders').where({ id: orderId }).first();
    });
  },

  async update(id, data, requester) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw notFound('Order not found');
    if (requester.role !== 'owner') throw forbidden();
    return ordersRepository.update(id, data);
  },

  async remove(id, requester) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw notFound('Order not found');
    if (requester.role !== 'owner') throw forbidden();
    await ordersRepository.delete(id);
  },

  async listItems(orderId, requester) {
    const order = await this.get(orderId, requester);
    return orderItemsRepository.listByOrderId(order.id);
  },
};
