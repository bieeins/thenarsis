export async function up(knex) {
  await knex.schema.createTable('design_income', (table) => {
    table.string('id', 36).primary();
    table.string('order_id', 36).notNullable().references('id').inTable('orders').onDelete('RESTRICT');
    table.string('designer_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('designer_name', 255).notNullable();
    table.decimal('fee_amount', 14, 2).notNullable();
    table.enu('status', ['pending', 'approved', 'paid'], {
      useNative: true,
      enumName: 'design_income_status_enum',
    }).notNullable();
    table.timestamp('created_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('order_id', 'idx_design_income_order_id');
    table.index('designer_id', 'idx_design_income_designer_id');
    table.index('status', 'idx_design_income_status');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('design_income');
}
