import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const crewAssignmentService = {
  async list(params = {}) {
    return apiClient.get(`/api/crew-assignments${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/crew-assignments/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/crew-assignments', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/crew-assignments/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/crew-assignments/${id}`);
  },
};
