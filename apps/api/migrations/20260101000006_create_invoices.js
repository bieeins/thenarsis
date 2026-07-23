export async function up(knex) {
  await knex.schema.createTable('invoices', (table) => {
    table.string('id', 36).primary();
    table.string('order_id', 36).notNullable().references('id').inTable('orders').onDelete('RESTRICT');
    table.string('invoice_number', 100).notNullable();
    table.decimal('total_amount', 14, 2).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique('invoice_number', { indexName: 'idx_invoices_invoice_number' });
    table.index('order_id', 'idx_invoices_order_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('invoices');
}
