import { expenseCategoriesService } from '../services/expense-categories.service.js';
import { ok, created } from '../utils/response.js';

export const expenseCategoriesController = {
  async list(req, res, next) {
    try {
      ok(res, await expenseCategoriesService.list());
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await expenseCategoriesService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await expenseCategoriesService.update(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await expenseCategoriesService.remove(req.params.id);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
