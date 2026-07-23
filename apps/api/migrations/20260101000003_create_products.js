export async function up(knex) {
  await knex.schema.createTable('products', (table) => {
    table.string('id', 36).primary();
    table.string('package_name', 255).notNullable();
    table.text('description').nullable();
    table.decimal('base_price', 14, 2).notNullable();
    table.enu('category', ['Photography', 'Videography', 'Bundle', 'Other'], {
      useNative: true,
      enumName: 'products_category_enum',
    }).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('category', 'idx_products_category');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('products');
}
