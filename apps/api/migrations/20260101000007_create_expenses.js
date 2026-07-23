export async function up(knex) {
  await knex.schema.createTable('expenses', (table) => {
    table.string('id', 36).primary();
    table.date('transaction_date').notNullable();
    table.enu('category', [
      'supplies', 'hosting', 'domain', 'internet', 'ads', 'equipment maintenance', 'food', 'other',
    ], {
      useNative: true,
      enumName: 'expenses_category_enum',
    }).notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.text('description').nullable();
    table.string('uploaded_by_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('receipt_file', 255).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('transaction_date', 'idx_expenses_transaction_date');
    table.index('category', 'idx_expenses_category');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('expenses');
}
