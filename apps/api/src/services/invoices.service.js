import { invoicesRepository } from '../repositories/invoices.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { notFound } from '../utils/http-error.js';

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
