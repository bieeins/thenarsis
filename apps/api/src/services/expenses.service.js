import { expensesRepository } from '../repositories/expenses.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { notFound } from '../utils/http-error.js';

const SORTABLE_FIELDS = ['created_at', 'transaction_date', 'amount', 'category'];

export const expensesService = {
  async list(query) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const { rows, totalItems } = await expensesRepository.list({
      category: query.category, startDate: query.startDate, endDate: query.endDate,
      page, perPage, offset, sortField: field, sortOrder: order,
    });
    return { rows, page, perPage, totalItems };
  },

  async get(id) {
    const expense = await expensesRepository.findById(id);
    if (!expense) throw notFound('Expense not found');
    return expense;
  },

  async create(data) {
    return expensesRepository.create(data);
  },

  async update(id, data) {
    await this.get(id);
    return expensesRepository.update(id, data);
  },

  async remove(id) {
    await this.get(id);
    await expensesRepository.delete(id);
  },
};
