import { crewAssignmentsRepository } from '../repositories/crew-assignments.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { badRequest, forbidden, notFound } from '../utils/http-error.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

const SORTABLE_FIELDS = ['created_at', 'status', 'assigned_date'];

export const crewAssignmentsService = {
  async list(query, requester) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const filters = { orderId: query.orderId, status: query.status, page, perPage, offset, sortField: field, sortOrder: order };
    if (requester.role !== 'owner') filters.crewId = requester.id;
    else if (query.crewId) filters.crewId = query.crewId;

    const { rows, totalItems } = await crewAssignmentsRepository.list(filters);
    return { rows, page, perPage, totalItems };
  },

  async get(id, requester) {
    const record = await crewAssignmentsRepository.findByIdExpanded(id);
    if (!record) throw notFound('Crew assignment not found');
    if (requester.role !== 'owner' && record.crew_id !== requester.id) throw forbidden();
    return record;
  },

  async create(data) {
    try {
      const record = await crewAssignmentsRepository.create({ ...data, assigned_date: new Date() });
      notificationService.notifyCrewAssignment(record).catch((err) => {
        logger.error({ err, crewAssignmentId: record.id }, 'notify_crew_assignment_failed');
      });
      return record;
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        throw badRequest('order_id, crew_id, or assigned_by does not reference an existing record');
      }
      throw err;
    }
  },

  async update(id, data, requester) {
    const existing = await crewAssignmentsRepository.findById(id);
    if (!existing) throw notFound('Crew assignment not found');
    if (requester.role !== 'owner' && existing.crew_id !== requester.id) throw forbidden();

    const patch = { ...data };
    if (data.attendance_status && data.attendance_status !== existing.attendance_status) {
      patch.attendance_date = new Date();
    }
    if (data.crew_notes && data.crew_notes !== existing.crew_notes) {
      patch.notes_timestamp = new Date();
    }

    return crewAssignmentsRepository.update(id, patch);
  },

  async remove(id, requester) {
    if (requester.role !== 'owner') throw forbidden();
    const existing = await crewAssignmentsRepository.findById(id);
    if (!existing) throw notFound('Crew assignment not found');
    await crewAssignmentsRepository.delete(id);
  },
};
