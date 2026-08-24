import { db } from '../config/database.js';
import { createBaseRepository } from './base.repository.js';

const TABLE = 'expense_categories';
const base = createBaseRepository(TABLE);

export const expenseCategoriesRepository = {
  ...base,

  async list() {
    return db(TABLE).orderBy('name', 'asc');
  },

  async findByName(name) {
    return db(TABLE).whereRaw('LOWER(name) = LOWER(?)', [name]).first();
  },

  async countExpensesUsingName(name) {
    const [{ count }] = await db('expenses').where({ category: name }).count({ count: '*' });
    return Number(count);
  },

  async renameInUseExpenses(oldName, newName, trx = db) {
    return trx('expenses').where({ category: oldName }).update({ category: newName });
  },
};
