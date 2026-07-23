import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const expenseService = {
  async list(params = {}) {
    return apiClient.get(`/api/expenses${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/expenses/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/expenses', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/expenses/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/expenses/${id}`);
  },
};
