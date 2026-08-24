import { expensesRepository } from '../repositories/expenses.repository.js';
import { expenseCategoriesRepository } from '../repositories/expense-categories.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { badRequest, notFound } from '../utils/http-error.js';

async function assertCategoryExists(name) {
  if (!name) return;
  const category = await expenseCategoriesRepository.findByName(name);
  if (!category) throw badRequest(`Unknown expense category "${name}". Add it under Financial Settings first.`);
}

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
    await assertCategoryExists(data.category);
    return expensesRepository.create(data);
  },

  async update(id, data) {
    await this.get(id);
    await assertCategoryExists(data.category);
    return expensesRepository.update(id, data);
  },

  async remove(id) {
    await this.get(id);
    await expensesRepository.delete(id);
  },
};
