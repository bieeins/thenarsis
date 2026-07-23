export async function up(knex) {
  await knex.schema.createTable('notes', (table) => {
    table.string('id', 36).primary();
    table.string('order_id', 36).notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.enu('user_role', ['owner', 'designer', 'crew'], {
      useNative: true,
      enumName: 'notes_user_role_enum',
    }).notNullable();
    table.string('user_name', 255).notNullable();
    table.text('note_content').notNullable();
    table.timestamp('created_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('order_id', 'idx_notes_order_id');
    table.index('user_id', 'idx_notes_user_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notes');
}
