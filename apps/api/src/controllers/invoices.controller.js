import { invoicesService } from '../services/invoices.service.js';
import { paymentsRepository } from '../repositories/payments.repository.js';
import { ok, created, paginated } from '../utils/response.js';

export const invoicesController = {
  async list(req, res, next) {
    try {
      const { rows, page, perPage, totalItems } = await invoicesService.list(req.query);
      paginated(res, rows, { page, perPage, totalItems });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      ok(res, await invoicesService.get(req.params.id));
    } catch (err) { next(err); }
  },

  // Public — matches PocketBase's public viewRule on invoices, used by InvoiceViewPage.
  async getPublicByNumber(req, res, next) {
    try {
      const invoice = await invoicesService.getByInvoiceNumber(req.params.invoiceNumber);
      const payments = await paymentsRepository.listByInvoiceId(invoice.id);
      ok(res, { ...invoice, payments });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      created(res, await invoicesService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      ok(res, await invoicesService.update(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await invoicesService.remove(req.params.id);
      ok(res, { deleted: true });
    } catch (err) { next(err); }
  },
};
