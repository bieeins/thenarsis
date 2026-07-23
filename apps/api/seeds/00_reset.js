// Deletes seed-affected tables in reverse dependency order so re-running
// `npm run db:seed` on a non-empty database doesn't hit FK constraint errors.
export async function seed(knex) {
  const tables = [
    'notes',
    'design_income',
    'notifications',
    'payments',
    'crew_assignments',
    'design_work',
    'invoices',
    'order_items',
    'orders',
    'expenses',
    'products',
    'sessions',
    'files',
    'users',
  ];

  for (const table of tables) {
    await knex(table).del();
  }
}
