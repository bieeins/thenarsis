import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const orderService = {
  async list(params = {}) {
    return apiClient.get(`/api/orders${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/orders/${id}`);
  },
  async listItems(orderId) {
    return apiClient.get(`/api/orders/${orderId}/items`);
  },
  async create(data) {
    return apiClient.post('/api/orders', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/orders/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/orders/${id}`);
  },
  async assignDesigner(orderId, designerId) {
    return apiClient.put(`/api/orders/${orderId}/designer`, { designer_id: designerId });
  },
  async assignCrew(orderId, crewIds) {
    return apiClient.put(`/api/orders/${orderId}/crew`, { crew_ids: crewIds });
  },
};
