import { db } from '../config/database.js';
import { paymentsRepository } from '../repositories/payments.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { notFound } from '../utils/http-error.js';
import { newId } from '../utils/id.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

const SORTABLE_FIELDS = ['created_at', 'payment_date', 'amount'];

export const paymentsService = {
  async list(query) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const { rows, totalItems } = await paymentsRepository.list({
      status: query.status, invoiceId: query.invoiceId, startDate: query.startDate, endDate: query.endDate,
      page, perPage, offset, sortField: field, sortOrder: order,
    });
    return { rows, page, perPage, totalItems };
  },

  async get(id) {
    const payment = await paymentsRepository.findById(id);
    if (!payment) throw notFound('Payment not found');
    return payment;
  },

  async create(data) {
    const payment = await db.transaction(async (trx) => {
      const invoice = await trx('invoices').where({ id: data.invoice_id }).first();
      if (!invoice) throw notFound('Invoice not found');
      const id = newId();
      await trx('payments').insert({ id, ...data });
      return trx('payments').where({ id }).first();
    });

    if (payment.payment_status === 'Confirmed') {
      notificationService.notifyPaymentReceived(payment).catch((err) => {
        logger.error({ err, paymentId: payment.id }, 'notify_payment_received_failed');
      });
    }

    return payment;
  },

  async update(id, data) {
    await this.get(id);
    return paymentsRepository.update(id, data);
  },

  async remove(id) {
    await this.get(id);
    await paymentsRepository.delete(id);
  },
};
