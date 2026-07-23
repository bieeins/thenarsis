export async function up(knex) {
  await knex.schema.createTable('design_work', (table) => {
    table.string('id', 36).primary();
    table.string('order_id', 36).notNullable().references('id').inTable('orders').onDelete('RESTRICT');
    table.string('designer_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.text('design_notes').nullable();
    table.enu('status', ['pending', 'in_progress', 'revision', 'completed'], {
      useNative: true,
      enumName: 'design_work_status_enum',
    }).notNullable();
    table.decimal('design_fee', 14, 2).nullable();
    table.string('design_file_link', 512).nullable();
    table.timestamp('assigned_date').nullable();
    table.string('assigned_by', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
    table.date('fee_submitted_date').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('order_id', 'idx_design_work_order_id');
    table.index('designer_id', 'idx_design_work_designer_id');
    table.index('status', 'idx_design_work_status');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('design_work');
}
