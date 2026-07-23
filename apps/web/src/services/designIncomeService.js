import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const designIncomeService = {
  async list(params = {}) {
    return apiClient.get(`/api/design-income${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/design-income/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/design-income', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/design-income/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/design-income/${id}`);
  },
};
