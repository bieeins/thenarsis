import { usersService } from '../services/users.service.js';
import { ok, created, paginated } from '../utils/response.js';

export const usersController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await usersService.list(req.query);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await usersService.get(req.params.id, req.user));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await usersService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await usersService.update(req.params.id, req.body, req.user));
    } catch (err) { next(err); }
  },

  async resetPassword(req, res, next) {
    try {
      await usersService.resetPassword(req.params.id, req.body.new_password, req.user);
      ok(res, { reset: true });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await usersService.remove(req.params.id, req.user);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
