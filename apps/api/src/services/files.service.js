import { filesRepository } from '../repositories/files.repository.js';
import { getStorageProvider } from '../storage/index.js';
import { randomStoredName } from '../middleware/upload.js';
import { forbidden, notFound } from '../utils/http-error.js';
import { expensesService } from './expenses.service.js';
import { designWorkService } from './design-work.service.js';

const RELATED_ACCESS_CHECKS = {
  expenses: async (relatedId, requester) => {
    if (requester.role !== 'owner') throw forbidden();
    await expensesService.get(relatedId);
  },
  design_work: async (relatedId, requester) => {
    await designWorkService.get(relatedId, requester);
  },
};

export const filesService = {
  async upload(file, uploadedBy, relatedTable, relatedId) {
    const storedName = randomStoredName(file.originalname);
    const storage = getStorageProvider();
    const storagePath = await storage.save(storedName, file.buffer);

    return filesRepository.create({
      original_name: file.originalname,
      stored_name: storedName,
      mime_type: file.mimetype,
      size: file.size,
      storage_path: storagePath,
      uploaded_by: uploadedBy,
      related_table: relatedTable || null,
      related_id: relatedId || null,
    });
  },

  async getForDownload(id, requester) {
    const file = await filesRepository.findById(id);
    if (!file) throw notFound('File not found');

    const canAlwaysAccess = requester.role === 'owner' || file.uploaded_by === requester.id;
    if (!canAlwaysAccess) {
      const check = file.related_table && RELATED_ACCESS_CHECKS[file.related_table];
      if (!check || !file.related_id) throw forbidden();
      await check(file.related_id, requester);
    }

    const storage = getStorageProvider();
    const buffer = await storage.read(file.stored_name);
    return { file, buffer };
  },
};
