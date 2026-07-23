import { apiClient } from '@/lib/apiClient.js';
import { toQueryString } from './queryString.js';

export const orderItemService = {
  async listByOrder(orderId) {
    const res = await apiClient.get(`/api/order-items${toQueryString({ orderId })}`);
    return res.data;
  },
  async create(data) {
    return apiClient.post('/api/order-items', data);
  },
  async update(id, data) {
    return apiClient.patch(`/api/order-items/${id}`, data);
  },
  async remove(id) {
    return apiClient.delete(`/api/order-items/${id}`);
  },
};
