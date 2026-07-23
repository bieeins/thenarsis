import { db } from '../config/database.js';

const TABLE = 'users';

const PUBLIC_COLUMNS = ['id', 'email', 'name', 'phone', 'role', 'avatar', 'verified', 'created_at', 'updated_at'];

export const usersRepository = {
  async findById(id) {
    return db(TABLE).where({ id }).first();
  },

  async findPublicById(id) {
    return db(TABLE).select(PUBLIC_COLUMNS).where({ id }).first();
  },

  async findByEmail(email) {
    return db(TABLE).whereRaw('LOWER(email) = LOWER(?)', [email]).first();
  },

  async list({ role, search, page, perPage, offset, sortField, sortOrder }) {
    const query = db(TABLE).select(PUBLIC_COLUMNS);
    const countQuery = db(TABLE);

    if (role) {
      query.where({ role });
      countQuery.where({ role });
    }
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      query.where((q) => q.whereRaw('LOWER(name) LIKE ?', [like]).orWhereRaw('LOWER(email) LIKE ?', [like]));
      countQuery.where((q) => q.whereRaw('LOWER(name) LIKE ?', [like]).orWhereRaw('LOWER(email) LIKE ?', [like]));
    }

    const [{ count }] = await countQuery.count({ count: '*' });
    const rows = await query.orderBy(sortField, sortOrder).limit(perPage).offset(offset);
    return { rows, totalItems: Number(count) };
  },

  async create(data) {
    await db(TABLE).insert(data);
    return this.findById(data.id);
  },

  async update(id, data) {
    await db(TABLE).where({ id }).update({ ...data, updated_at: db.fn.now() });
    return this.findById(id);
  },

  async delete(id) {
    return db(TABLE).where({ id }).delete();
  },
};

export const USERS_PUBLIC_COLUMNS = PUBLIC_COLUMNS;
