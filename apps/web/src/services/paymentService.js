import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const paymentService = {
  async list(params = {}) {
    return apiClient.get(`/api/payments${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/payments/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/payments', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/payments/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/payments/${id}`);
  },
};
