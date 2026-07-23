import { designIncomeRepository } from '../repositories/design-income.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { forbidden, notFound } from '../utils/http-error.js';

const SORTABLE_FIELDS = ['created_at', 'status', 'fee_amount'];

export const designIncomeService = {
  async list(query, requester) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const filters = { status: query.status, page, perPage, offset, sortField: field, sortOrder: order };
    if (requester.role !== 'owner') filters.designerId = requester.id;
    else if (query.designerId) filters.designerId = query.designerId;

    const { rows, totalItems } = await designIncomeRepository.list(filters);
    return { rows, page, perPage, totalItems };
  },

  async get(id, requester) {
    const record = await designIncomeRepository.findById(id);
    if (!record) throw notFound('Design income record not found');
    if (requester.role !== 'owner' && record.designer_id !== requester.id) throw forbidden();
    return record;
  },

  async create(data, requester) {
    if (data.designer_id !== requester.id) throw forbidden('You can only submit design income for yourself');
    return designIncomeRepository.create(data);
  },

  async update(id, data, requester) {
    const existing = await this.get(id, requester);
    if (requester.role !== 'owner' && existing.designer_id !== requester.id) throw forbidden();
    return designIncomeRepository.update(id, data);
  },

  async remove(id, requester) {
    if (requester.role !== 'owner') throw forbidden();
    await this.get(id, requester);
    await designIncomeRepository.delete(id);
  },
};
