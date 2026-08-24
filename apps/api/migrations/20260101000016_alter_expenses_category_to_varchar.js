// Expense categories used to be a fixed enum; they are now managed via the
// expense_categories table so owners can add/rename/remove them. Widening
// this column to VARCHAR lets it hold any category name, not just the
// original 8 enum values.
export async function up(knex) {
  await knex.raw('ALTER TABLE expenses MODIFY category VARCHAR(100) NOT NULL');
}

export async function down(knex) {
  await knex.raw(
    "ALTER TABLE expenses MODIFY category ENUM('supplies','hosting','domain','internet','ads','equipment maintenance','food','other') NOT NULL",
  );
}
