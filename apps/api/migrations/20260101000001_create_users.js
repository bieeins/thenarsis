export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('phone', 50).nullable();
    table.enu('role', ['owner', 'designer', 'crew', 'design_reviewer'], {
      useNative: true,
      enumName: 'users_role_enum',
    }).notNullable();
    table.string('avatar', 255).nullable();
    table.boolean('verified').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique('email', { indexName: 'idx_users_email_unique' });
    table.index('role', 'idx_users_role');
  });

  // enforce case-insensitive uniqueness explicitly (MySQL default collation utf8mb4_0900_ai_ci is already
  // case-insensitive, but normalize on write in the repository layer too)
  await knex.raw('ALTER TABLE users MODIFY email VARCHAR(255) COLLATE utf8mb4_0900_ai_ci NOT NULL');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
