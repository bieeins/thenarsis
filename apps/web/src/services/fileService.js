import { apiClient } from '@/lib/apiClient.js';

export const fileService = {
  async upload(file, relatedTable, relatedId) {
    const formData = new FormData();
    formData.append('file', file);
    if (relatedTable) formData.append('relatedTable', relatedTable);
    if (relatedId) formData.append('relatedId', relatedId);
    return apiClient.upload('/api/files', formData);
  },
  async getObjectUrl(fileId) {
    return apiClient.fetchFileObjectUrl(fileId);
  },
};
