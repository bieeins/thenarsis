import { apiClient } from '@/lib/apiClient.js';

export const expenseCategoryService = {
  async list() {
    const res = await apiClient.get('/api/expense-categories');
    return res.data;
  },
  async create(name) {
    return apiClient.post('/api/expense-categories', { name });
  },
  async update(id, name) {
    return apiClient.patch(`/api/expense-categories/${id}`, { name });
  },
  async remove(id) {
    return apiClient.delete(`/api/expense-categories/${id}`);
  },
};
