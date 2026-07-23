export async function up(knex) {
  await knex.schema.createTable('payments', (table) => {
    table.string('id', 36).primary();
    table.string('invoice_id', 36).notNullable().references('id').inTable('invoices').onDelete('RESTRICT');
    table.decimal('amount', 14, 2).notNullable();
    table.date('payment_date').notNullable();
    table.enu('payment_method', ['Bank Transfer', 'Credit Card', 'E-wallet', 'Cash', 'Check', 'Other'], {
      useNative: true,
      enumName: 'payments_method_enum',
    }).notNullable();
    table.text('notes').nullable();
    table.enu('payment_status', ['Pending', 'Confirmed', 'Failed'], {
      useNative: true,
      enumName: 'payments_status_enum',
    }).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('invoice_id', 'idx_payments_invoice_id');
    table.index('payment_status', 'idx_payments_status');
    table.index('payment_date', 'idx_payments_date');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('payments');
}
