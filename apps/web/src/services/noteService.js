import { apiClient } from '@/lib/apiClient.js';
import { toQueryString } from './queryString.js';

export const noteService = {
  async listByOrder(orderId) {
    const res = await apiClient.get(`/api/notes${toQueryString({ orderId })}`);
    return res.data;
  },
  async create(data) {
    return apiClient.post('/api/notes', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/notes/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/notes/${id}`);
  },
};
