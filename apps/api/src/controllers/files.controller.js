import { filesService } from '../services/files.service.js';
import { created } from '../utils/response.js';
import { badRequest } from '../utils/http-error.js';

export const filesController = {
  async upload(req, res, next) {
    try {
      if (!req.file) throw badRequest('No file was uploaded');
      const record = await filesService.upload(req.file, req.user.id, req.body.relatedTable, req.body.relatedId);
      created(res, record);
    } catch (err) { next(err); }
  },

  async download(req, res, next) {
    try {
      const { file, buffer } = await filesService.getForDownload(req.params.id, req.user);
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
      res.send(buffer);
    } catch (err) { next(err); }
  },
};
