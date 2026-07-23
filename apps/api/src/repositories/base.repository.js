import { db } from '../config/database.js';
import { newId } from '../utils/id.js';

export function createBaseRepository(table) {
  return {
    table,

    async findById(id, trx = db) {
      return trx(table).where({ id }).first();
    },

    async findAll(where = {}, trx = db) {
      return trx(table).where(where);
    },

    async create(data, trx = db) {
      const id = data.id || newId();
      await trx(table).insert({ id, ...data });
      return trx(table).where({ id }).first();
    },

    async update(id, data, trx = db) {
      await trx(table).where({ id }).update({ ...data, updated_at: db.fn.now() });
      return trx(table).where({ id }).first();
    },

    async delete(id, trx = db) {
      return trx(table).where({ id }).delete();
    },
  };
}
