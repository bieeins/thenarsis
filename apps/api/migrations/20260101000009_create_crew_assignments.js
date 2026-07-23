export async function up(knex) {
  await knex.schema.createTable('crew_assignments', (table) => {
    table.string('id', 36).primary();
    table.string('order_id', 36).notNullable().references('id').inTable('orders').onDelete('RESTRICT');
    table.string('crew_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.decimal('fee', 14, 2).nullable();
    table.enu('status', ['pending', 'in_progress', 'completed'], {
      useNative: true,
      enumName: 'crew_assignments_status_enum',
    }).notNullable();
    table.decimal('paid_amount', 14, 2).nullable();
    table.decimal('pending_amount', 14, 2).nullable();
    table.enu('attendance_status', ['pending', 'confirmed', 'completed', 'hadir'], {
      useNative: true,
      enumName: 'crew_assignments_attendance_status_enum',
    }).nullable();
    table.timestamp('attendance_date').nullable();
    table.text('attendance_reason').nullable();
    table.timestamp('assigned_date').nullable();
    table.string('assigned_by', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
    table.decimal('attendance_amount', 14, 2).nullable();
    table.text('crew_notes').nullable();
    table.datetime('check_in_time').nullable();
    table.datetime('check_out_time').nullable();
    table.boolean('attendance_confirmation').nullable();
    table.timestamp('notes_timestamp').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('order_id', 'idx_crew_assignments_order_id');
    table.index('crew_id', 'idx_crew_assignments_crew_id');
    table.index('status', 'idx_crew_assignments_status');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('crew_assignments');
}
