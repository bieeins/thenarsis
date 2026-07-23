export async function up(knex) {
  await knex.schema.createTable('files', (table) => {
    table.string('id', 36).primary();
    table.string('original_name', 255).notNullable();
    table.string('stored_name', 255).notNullable();
    table.string('mime_type', 150).notNullable();
    table.integer('size').unsigned().notNullable();
    table.string('storage_path', 512).notNullable();
    table.string('uploaded_by', 36).notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('related_table', 100).nullable();
    table.string('related_id', 36).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('uploaded_by', 'idx_files_uploaded_by');
    table.index(['related_table', 'related_id'], 'idx_files_related');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('files');
}
