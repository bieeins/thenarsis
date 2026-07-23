import { paymentsService } from '../services/payments.service.js';
import { ok, created, paginated } from '../utils/response.js';

export const paymentsController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await paymentsService.list(req.query);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await paymentsService.get(req.params.id));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await paymentsService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await paymentsService.update(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await paymentsService.remove(req.params.id);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
