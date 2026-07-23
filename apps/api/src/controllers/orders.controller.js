import { ordersService } from '../services/orders.service.js';
import { ok, created, paginated } from '../utils/response.js';

export const ordersController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await ordersService.list(req.query, req.user);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await ordersService.get(req.params.id, req.user));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await ordersService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await ordersService.update(req.params.id, req.body, req.user));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await ordersService.remove(req.params.id, req.user);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },

  async listItems(req, res, next) {
    try {
      ok(res, await ordersService.listItems(req.params.id, req.user));
    } catch (err) { next(err); }
  },
};
