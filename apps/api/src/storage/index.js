import { env } from '../config/env.js';
import { localStorageProvider } from './local-storage-provider.js';

// Only 'local' is implemented today. To add S3-compatible storage in production,
// implement the same save/read/delete interface and select it here based on
// env.storage.driver === 's3'.
export function getStorageProvider() {
  if (env.storage.driver !== 'local') {
    throw new Error(`Unsupported STORAGE_DRIVER "${env.storage.driver}" — only "local" is implemented`);
  }
  return localStorageProvider;
}
