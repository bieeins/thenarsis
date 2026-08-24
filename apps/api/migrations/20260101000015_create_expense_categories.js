const DEFAULT_CATEGORIES = [
  'supplies', 'hosting', 'domain', 'internet', 'ads', 'equipment maintenance', 'food', 'other',
];

export async function up(knex) {
  await knex.schema.createTable('expense_categories', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique('name', { indexName: 'idx_expense_categories_name' });
  });

  // Seed the categories that previously made up the hardcoded enum, so
  // existing expense rows keep resolving to a real, manageable category.
  const crypto = await import('node:crypto');
  await knex('expense_categories').insert(
    DEFAULT_CATEGORIES.map((name) => ({ id: crypto.randomUUID(), name })),
  );
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('expense_categories');
}
