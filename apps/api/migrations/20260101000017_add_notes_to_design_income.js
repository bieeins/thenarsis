export async function up(knex) {
  await knex.schema.alterTable('design_income', (table) => {
    table.text('notes').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('design_income', (table) => {
    table.dropColumn('notes');
  });
}
