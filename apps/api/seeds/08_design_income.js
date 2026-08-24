export async function seed(knex) {
  await knex('design_income').insert([
    {
      id: 'di0wedding00010000000001',
      order_id: 'yx3qmnw1pgq114k',
      designer_id: 't1ru9d7pqhqdx86',
      designer_name: 'Professional Designer',
      fee_amount: 200000,
      status: 'pending',
    },
  ]);
}
