import { crewAssignmentsService } from '../services/crew-assignments.service.js';
import { ok, created, paginated } from '../utils/response.js';

export const crewAssignmentsController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await crewAssignmentsService.list(req.query, req.user);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await crewAssignmentsService.get(req.params.id, req.user));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await crewAssignmentsService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await crewAssignmentsService.update(req.params.id, req.body, req.user));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await crewAssignmentsService.remove(req.params.id, req.user);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
