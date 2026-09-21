import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const userService = {
  async list(params = {}) {
    return apiClient.get(`/api/users${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/users/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/users', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/users/${id}`, data);
  },
  async resetPassword(id, newPassword) {
    return apiClient.put(`/api/users/${id}/password`, { new_password: newPassword });
  },
  async remove(id) {
    return apiClient.delete(`/api/users/${id}`);
  },
};
