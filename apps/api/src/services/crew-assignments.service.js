import { crewAssignmentsRepository } from '../repositories/crew-assignments.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { badRequest, forbidden, notFound } from '../utils/http-error.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

const SORTABLE_FIELDS = ['created_at', 'status', 'assigned_date'];

// Fee/compensation fields are private to the crew member they belong to.
// A teammate should only see who else is on the same event and their
// attendance status, never someone else's pay.
function hideCompensation(row) {
  return {
    ...row,
    fee: null,
    paid_amount: null,
    pending_amount: null,
    attendance_amount: null,
    crew_notes: null,
  };
}

export const crewAssignmentsService = {
  async list(query, requester) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const filters = { orderId: query.orderId, status: query.status, page, perPage, offset, sortField: field, sortOrder: order };

    let restrictToSelf = requester.role !== 'owner';
    if (restrictToSelf && query.orderId) {
      // A crew member may see the full crew list for an order they are
      // themselves assigned to (so they know who else is working the same
      // event), but nothing about orders they have no assignment on.
      const own = await crewAssignmentsRepository.list({
        orderId: query.orderId, crewId: requester.id, page: 1, perPage: 1, offset: 0, sortField: 'created_at', sortOrder: 'asc',
      });
      restrictToSelf = own.totalItems === 0;
    }
    if (restrictToSelf) filters.crewId = requester.id;
    else if (requester.role === 'owner' && query.crewId) filters.crewId = query.crewId;

    const { rows, totalItems } = await crewAssignmentsRepository.list(filters);
    const sanitizedRows = requester.role === 'owner'
      ? rows
      : rows.map((row) => (row.crew_id === requester.id ? row : hideCompensation(row)));

    return { rows: sanitizedRows, page, perPage, totalItems };
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
