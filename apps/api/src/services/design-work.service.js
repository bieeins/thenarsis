import { db } from '../config/database.js';
import { designWorkRepository } from '../repositories/design-work.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { forbidden, notFound } from '../utils/http-error.js';
import { newId } from '../utils/id.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

const SORTABLE_FIELDS = ['created_at', 'status', 'assigned_date'];

function canViewAny(user) {
  return ['owner', 'design_reviewer', 'crew'].includes(user.role);
}

export const designWorkService = {
  async list(query, requester) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const filters = {
      orderId: query.orderId, status: query.status,
      page, perPage, offset, sortField: field, sortOrder: order,
    };
    if (!canViewAny(requester)) filters.designerId = requester.id;
    else if (query.designerId) filters.designerId = query.designerId;

    const { rows, totalItems } = await designWorkRepository.list(filters);
    return { rows, page, perPage, totalItems };
  },

  async get(id, requester) {
    const record = await designWorkRepository.findByIdExpanded(id);
    if (!record) throw notFound('Design work not found');
    if (!canViewAny(requester) && record.designer_id !== requester.id) throw forbidden();
    return record;
  },

  async create(data) {
    const record = await designWorkRepository.create({
      ...data,
      assigned_date: new Date(),
    });

    notificationService.notifyDesignerAssignment(record).catch((err) => {
      logger.error({ err, designWorkId: record.id }, 'notify_designer_assignment_failed');
    });

    return record;
  },

  async update(id, data, requester) {
    const existing = await designWorkRepository.findById(id);
    if (!existing) throw notFound('Design work not found');
    if (requester.role !== 'owner' && existing.designer_id !== requester.id) throw forbidden();

    const becameCompleted = data.status === 'completed' && existing.status !== 'completed';

    const updated = await db.transaction(async (trx) => {
      await trx('design_work').where({ id }).update({ ...data, updated_at: trx.fn.now() });
      const record = await trx('design_work').where({ id }).first();

      if (becameCompleted && record.design_fee) {
        const existingIncome = await trx('design_income').where({ order_id: record.order_id, designer_id: record.designer_id }).first();
        if (!existingIncome) {
          const designer = await trx('users').where({ id: record.designer_id }).first();
          await trx('design_income').insert({
            id: newId(),
            order_id: record.order_id,
            designer_id: record.designer_id,
            designer_name: designer ? designer.name : 'Unknown',
            fee_amount: record.design_fee,
            status: 'pending',
          });
        }
      }

      return record;
    });

    if (becameCompleted) {
      notificationService.notifyDesignComplete(updated).catch((err) => {
        logger.error({ err, designWorkId: id }, 'notify_design_complete_failed');
      });
    }

    return updated;
  },

  async remove(id, requester) {
    const existing = await designWorkRepository.findById(id);
    if (!existing) throw notFound('Design work not found');
    if (requester.role !== 'owner') throw forbidden();
    await designWorkRepository.delete(id);
  },
};
