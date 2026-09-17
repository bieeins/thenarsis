import { db } from '../config/database.js';
import { ordersRepository } from '../repositories/orders.repository.js';
import { orderItemsRepository } from '../repositories/order-items.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { badRequest, forbidden, notFound } from '../utils/http-error.js';
import { newId } from '../utils/id.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

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

  // Deleting an order also removes every record that only exists because of
  // it (order items, invoices + their payments, design work, design income,
  // crew assignments). Notes cascade at the DB level and notifications just
  // lose their order reference (ON DELETE SET NULL), so those need no
  // explicit cleanup here. Everything else has a RESTRICT foreign key, so
  // this has to run as one transaction in dependency order or the final
  // `orders` delete would fail.
  async remove(id, requester) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw notFound('Order not found');
    if (requester.role !== 'owner') throw forbidden();

    await db.transaction(async (trx) => {
      const invoiceIds = await trx('invoices').where({ order_id: id }).pluck('id');
      if (invoiceIds.length > 0) {
        await trx('payments').whereIn('invoice_id', invoiceIds).delete();
      }
      await trx('invoices').where({ order_id: id }).delete();
      await trx('design_income').where({ order_id: id }).delete();
      await trx('crew_assignments').where({ order_id: id }).delete();
      await trx('design_work').where({ order_id: id }).delete();
      await trx('order_items').where({ order_id: id }).delete();
      await trx('orders').where({ id }).delete();
    });
  },

  async listItems(orderId, requester) {
    const order = await this.get(orderId, requester);
    return orderItemsRepository.listByOrderId(order.id);
  },

  // Assigning a designer touches both `orders.assigned_designer_id` and the
  // `design_work` record in one transaction, so the owner's order list and
  // the designer's own project list can never disagree about who is on an
  // order — one always used to lag behind the other since the frontend
  // previously made these as two separate, non-atomic API calls.
  async assignDesigner(orderId, designerId, requester) {
    if (requester.role !== 'owner') throw forbidden();
    const existingOrder = await ordersRepository.findById(orderId);
    if (!existingOrder) throw notFound('Order not found');

    const designer = await db('users').where({ id: designerId, role: 'designer' }).first();
    if (!designer) throw badRequest('designer_id does not reference an existing designer');

    const designWork = await db.transaction(async (trx) => {
      await trx('orders').where({ id: orderId }).update({ assigned_designer_id: designerId, updated_at: trx.fn.now() });

      const existingWork = await trx('design_work').where({ order_id: orderId }).first();
      if (existingWork) {
        await trx('design_work').where({ id: existingWork.id }).update({ designer_id: designerId, updated_at: trx.fn.now() });
        return trx('design_work').where({ id: existingWork.id }).first();
      }

      const id = newId();
      await trx('design_work').insert({ id, order_id: orderId, designer_id: designerId, status: 'pending', assigned_date: trx.fn.now() });
      return trx('design_work').where({ id }).first();
    });

    notificationService.notifyDesignerAssignment(designWork).catch((err) => {
      logger.error({ err, orderId, designWorkId: designWork.id }, 'notify_designer_assignment_failed');
    });

    return ordersRepository.findByIdExpanded(orderId);
  },

  // Syncs an order's crew list (add/remove) in one transaction, so a crew
  // member never ends up with an assignment the owner's order view doesn't
  // know about, or vice versa.
  async assignCrew(orderId, crewIds, requester) {
    if (requester.role !== 'owner') throw forbidden();
    const existingOrder = await ordersRepository.findById(orderId);
    if (!existingOrder) throw notFound('Order not found');

    const uniqueCrewIds = [...new Set(crewIds)];
    if (uniqueCrewIds.length > 0) {
      const validCrew = await db('users').whereIn('id', uniqueCrewIds).andWhere({ role: 'crew' });
      if (validCrew.length !== uniqueCrewIds.length) {
        throw badRequest('crew_ids contains an id that is not a valid crew member');
      }
    }

    const { addedRows, allAssignments } = await db.transaction(async (trx) => {
      const existingAssignments = await trx('crew_assignments').where({ order_id: orderId });
      const existingIds = existingAssignments.map((a) => a.crew_id);

      const toRemove = existingAssignments.filter((a) => !uniqueCrewIds.includes(a.crew_id));
      const toAdd = uniqueCrewIds.filter((id) => !existingIds.includes(id));

      if (toRemove.length > 0) {
        await trx('crew_assignments').whereIn('id', toRemove.map((a) => a.id)).delete();
      }

      const added = [];
      for (const crewId of toAdd) {
        const id = newId();
        await trx('crew_assignments').insert({
          id, order_id: orderId, crew_id: crewId, status: 'pending', assigned_date: trx.fn.now(),
        });
        added.push(await trx('crew_assignments').where({ id }).first());
      }

      return { addedRows: added, allAssignments: await trx('crew_assignments').where({ order_id: orderId }) };
    });

    addedRows.forEach((row) => {
      notificationService.notifyCrewAssignment(row).catch((err) => {
        logger.error({ err, crewAssignmentId: row.id }, 'notify_crew_assignment_failed');
      });
    });

    return allAssignments;
  },
};
