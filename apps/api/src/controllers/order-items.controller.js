import { orderItemsRepository } from '../repositories/order-items.repository.js';
import { notFound } from '../utils/http-error.js';
import { ok, created } from '../utils/response.js';

export const orderItemsController = {
  async list(req, res, next) {
    try {
      if (req.query.orderId) {
        return ok(res, await orderItemsRepository.listByOrderId(req.query.orderId));
      }
      ok(res, await orderItemsRepository.findAll());
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      const item = await orderItemsRepository.findById(req.params.id);
      if (!item) throw notFound('Order item not found');
      ok(res, item);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await orderItemsRepository.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const item = await orderItemsRepository.findById(req.params.id);
      if (!item) throw notFound('Order item not found');
      ok(res, await orderItemsRepository.update(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      const item = await orderItemsRepository.findById(req.params.id);
      if (!item) throw notFound('Order item not found');
      await orderItemsRepository.delete(req.params.id);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
