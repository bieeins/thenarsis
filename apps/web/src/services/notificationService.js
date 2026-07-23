import { apiClient } from '@/lib/apiClient.js';

export const notificationService = {
  async listMine() {
    const res = await apiClient.get('/api/notifications');
    return res.data;
  },
  async create(data) {
    return apiClient.post('/api/notifications', data);
  },
  async markRead(id) {
    return apiClient.patch(`/api/notifications/${id}/read`);
  },
  async remove(id) {
    return apiClient.delete(`/api/notifications/${id}`);
  },
};
