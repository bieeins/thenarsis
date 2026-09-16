import { invoicesRepository } from '../repositories/invoices.repository.js';
import { ordersRepository } from '../repositories/orders.repository.js';
import { paymentsRepository } from '../repositories/payments.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { notFound } from '../utils/http-error.js';

// Only the fields a customer needs to read their own invoice — never the
// internal assignment/notes fields that come back on the authenticated
// order record.
function toPublicOrder(order) {
  if (!order) return null;
  return {
    customer_name: order.customer_name,
    phone_number: order.phone_number,
    event_name: order.event_name,
    event_date: order.event_date,
    event_location: order.event_location,
    product: order.product ? {
      package_name: order.product.package_name,
      description: order.product.description,
    } : null,
  };
}

const SORTABLE_FIELDS = ['created_at', 'invoice_number', 'total_amount'];

export const invoicesService = {
  async list(query) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const { rows, totalItems } = await invoicesRepository.list({
      search: query.search, page, perPage, offset, sortField: field, sortOrder: order,
    });
    return { rows, page, perPage, totalItems };
  },

  async get(id) {
    const invoice = await invoicesRepository.findById(id);
    if (!invoice) throw notFound('Invoice not found');
    return invoice;
  },

  // Public lookup used by the customer-facing invoice view page — no auth required,
  // mirroring PocketBase's viewRule = "" (public) for invoices.
  async getByInvoiceNumber(invoiceNumber) {
    const invoice = await invoicesRepository.findByInvoiceNumber(invoiceNumber);
    if (!invoice) throw notFound('Invoice not found');
    return invoice;
  },

  // Same public lookup, but also includes the customer/event details a
  // shared invoice link needs to render — without requiring the viewer to
  // log in (the orders API itself stays authenticated for everything else).
  async getPublicSummaryByInvoiceNumber(invoiceNumber) {
    const invoice = await this.getByInvoiceNumber(invoiceNumber);
    const [payments, order] = await Promise.all([
      paymentsRepository.listByInvoiceId(invoice.id),
      ordersRepository.findByIdExpanded(invoice.order_id),
    ]);
    return { ...invoice, payments, order: toPublicOrder(order) };
  },

  async create(data) {
    return invoicesRepository.create(data);
  },

  async update(id, data) {
    await this.get(id);
    return invoicesRepository.update(id, data);
  },

  async remove(id) {
    await this.get(id);
    await invoicesRepository.delete(id);
  },
};
