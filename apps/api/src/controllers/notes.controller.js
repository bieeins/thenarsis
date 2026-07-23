import { notesService } from '../services/notes.service.js';
import { ok, created } from '../utils/response.js';
import { badRequest } from '../utils/http-error.js';

export const notesController = {
  async list(req, res, next) {
    try {
      if (!req.query.orderId) throw badRequest('orderId query parameter is required');
      ok(res, await notesService.listByOrderId(req.query.orderId));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await notesService.create(req.body, req.user));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await notesService.update(req.params.id, req.body, req.user));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await notesService.remove(req.params.id, req.user);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
