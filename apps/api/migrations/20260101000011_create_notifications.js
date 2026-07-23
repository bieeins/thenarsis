export async function up(knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('type', ['assignment', 'status_change', 'design_ready', 'payment_received'], {
      useNative: true,
      enumName: 'notifications_type_enum',
    }).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.string('related_order_id', 36).nullable().references('id').inTable('orders').onDelete('SET NULL');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('created_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'idx_notifications_user_id');
    table.index('is_read', 'idx_notifications_is_read');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
}
