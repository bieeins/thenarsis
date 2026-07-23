import { apiClient } from '@/lib/apiClient.js';
import { toQueryString, fetchAllPages } from './queryString.js';

export const productService = {
  async list(params = {}) {
    return apiClient.get(`/api/products${toQueryString(params)}`);
  },
  async listAll(params = {}) {
    return fetchAllPages((p) => this.list(p), params);
  },
  async get(id) {
    return apiClient.get(`/api/products/${id}`);
  },
  async create(data) {
    return apiClient.post('/api/products', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/products/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/products/${id}`);
  },
};
