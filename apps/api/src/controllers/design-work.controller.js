import { designWorkService } from '../services/design-work.service.js';
import { ok, created, paginated } from '../utils/response.js';

export const designWorkController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await designWorkService.list(req.query, req.user);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await designWorkService.get(req.params.id, req.user));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await designWorkService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await designWorkService.update(req.params.id, req.body, req.user));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await designWorkService.remove(req.params.id, req.user);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
