import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

const uploadDir = path.resolve(env.storage.uploadDir);

export class LocalStorageProvider {
  async ensureReady() {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  resolvePath(storedName) {
    const safeName = path.basename(storedName);
    return path.join(uploadDir, safeName);
  }

  async save(storedName, buffer) {
    await this.ensureReady();
    const target = this.resolvePath(storedName);
    await fs.writeFile(target, buffer);
    return target;
  }

  async read(storedName) {
    return fs.readFile(this.resolvePath(storedName));
  }

  async delete(storedName) {
    try {
      await fs.unlink(this.resolvePath(storedName));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

export const localStorageProvider = new LocalStorageProvider();
