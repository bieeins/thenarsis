import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const invoiceService = {
  async list(params = {}) {
    return apiClient.get(`/api/invoices${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/invoices/${id}`);
  },
  // Public — no auth required, used by the customer-facing invoice page.
  async getPublicByNumber(invoiceNumber) {
    return apiClient.get(`/api/invoices/public/${encodeURIComponent(invoiceNumber)}`);
  },
  async create(data) {
    return apiClient.post('/api/invoices', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/invoices/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/invoices/${id}`);
  },
};
