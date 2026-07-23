import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { badRequest } from '../utils/http-error.js';

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!env.storage.allowedFileTypes.includes(file.mimetype)) {
    return cb(badRequest(`File type ${file.mimetype} is not allowed`));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: env.storage.maxUploadSize },
  fileFilter,
});

export function randomStoredName(originalName) {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/gi, '');
  return `${crypto.randomBytes(24).toString('hex')}${ext}`;
}
