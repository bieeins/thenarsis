export async function up(knex) {
  await knex.schema.createTable('order_items', (table) => {
    table.string('id', 36).primary();
    table.string('order_id', 36).notNullable().references('id').inTable('orders').onDelete('RESTRICT');
    table.string('product_id', 36).notNullable().references('id').inTable('products').onDelete('RESTRICT');
    table.decimal('base_price', 14, 2).notNullable();
    table.decimal('adjusted_price', 14, 2).nullable();
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('order_id', 'idx_order_items_order_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('order_items');
}
