import { db } from '../config/database.js';
import { expenseCategoriesRepository } from '../repositories/expense-categories.repository.js';
import { conflict, notFound } from '../utils/http-error.js';

export const expenseCategoriesService = {
  async list() {
    return expenseCategoriesRepository.list();
  },

  async create({ name }) {
    const existing = await expenseCategoriesRepository.findByName(name);
    if (existing) throw conflict('A category with this name already exists');
    return expenseCategoriesRepository.create({ name });
  },

  async update(id, { name }) {
    const category = await expenseCategoriesRepository.findById(id);
    if (!category) throw notFound('Expense category not found');

    const existing = await expenseCategoriesRepository.findByName(name);
    if (existing && existing.id !== id) throw conflict('A category with this name already exists');

    if (name === category.name) return category;

    return db.transaction(async (trx) => {
      await trx('expense_categories').where({ id }).update({ name, updated_at: trx.fn.now() });
      // Keep existing expense rows pointing at a category that still exists
      // in the managed list — renaming must not orphan them.
      await expenseCategoriesRepository.renameInUseExpenses(category.name, name, trx);
      return trx('expense_categories').where({ id }).first();
    });
  },

  async remove(id) {
    const category = await expenseCategoriesRepository.findById(id);
    if (!category) throw notFound('Expense category not found');

    const usageCount = await expenseCategoriesRepository.countExpensesUsingName(category.name);
    if (usageCount > 0) {
      throw conflict(`Cannot delete "${category.name}" — it is used by ${usageCount} expense record(s). Reassign or delete those first.`);
    }

    await expenseCategoriesRepository.delete(id);
  },
};
