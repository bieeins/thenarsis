import { productsService } from '../services/products.service.js';
import { ok, created, paginated } from '../utils/response.js';

export const productsController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await productsService.list(req.query);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await productsService.get(req.params.id));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await productsService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await productsService.update(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await productsService.remove(req.params.id);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
