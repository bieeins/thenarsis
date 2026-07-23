export async function up(knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('refresh_token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'idx_sessions_user_id');
    table.index('expires_at', 'idx_sessions_expires_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sessions');
}
