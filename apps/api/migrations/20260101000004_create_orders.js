export async function up(knex) {
  await knex.schema.createTable('orders', (table) => {
    table.string('id', 36).primary();
    table.string('customer_name', 255).notNullable();
    table.string('phone_number', 50).notNullable();
    table.string('event_name', 255).notNullable();
    table.date('event_date').notNullable();
    table.string('event_location', 255).notNullable();
    table.string('product_id', 36).notNullable().references('id').inTable('products').onDelete('RESTRICT');
    table.string('assigned_designer_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
    table.enu('status', ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'], {
      useNative: true,
      enumName: 'orders_status_enum',
    }).notNullable();
    table.string('invoice_number', 100).nullable();
    table.text('description').nullable();
    table.text('designer_notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique('invoice_number', { indexName: 'idx_orders_invoice_number' });
    table.index('status', 'idx_orders_status');
    table.index('event_date', 'idx_orders_event_date');
    table.index('assigned_designer_id', 'idx_orders_assigned_designer_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('orders');
}
