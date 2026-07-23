process.env.NODE_ENV = 'test';

export async function setup() {
  const knexfile = (await import('../knexfile.js')).default;
  const knexFactory = (await import('knex')).default;
  const db = knexFactory(knexfile.test);
  await db.migrate.latest();
  await db.destroy();
}
