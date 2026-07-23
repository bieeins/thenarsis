import { notificationsResourceService } from '../services/notifications-resource.service.js';
import { ok, created } from '../utils/response.js';

export const notificationsController = {
  async list(req, res, next) {
    try {
      ok(res, await notificationsResourceService.listForUser(req.user.id));
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await notificationsResourceService.create(req.body, req.user));
    } catch (err) { next(err); }
  },

  async markRead(req, res, next) {
    try {
      ok(res, await notificationsResourceService.markRead(req.params.id, req.user));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await notificationsResourceService.remove(req.params.id, req.user);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
