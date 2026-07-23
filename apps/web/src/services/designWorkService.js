import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const designWorkService = {
  async list(params = {}) {
    return apiClient.get(`/api/design-work${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/design-work/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/design-work', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/design-work/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/design-work/${id}`);
  },
};
