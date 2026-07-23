import { notesRepository } from '../repositories/notes.repository.js';
import { forbidden, notFound } from '../utils/http-error.js';

export const notesService = {
  async listByOrderId(orderId) {
    return notesRepository.listByOrderId(orderId);
  },

  async create(data, requester) {
    return notesRepository.create({ ...data, user_id: requester.id });
  },

  async update(id, data, requester) {
    const note = await notesRepository.findById(id);
    if (!note) throw notFound('Note not found');
    if (note.user_id !== requester.id) throw forbidden();
    return notesRepository.update(id, data);
  },

  async remove(id, requester) {
    const note = await notesRepository.findById(id);
    if (!note) throw notFound('Note not found');
    if (note.user_id !== requester.id) throw forbidden();
    await notesRepository.delete(id);
  },
};
