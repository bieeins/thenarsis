export async function seed(knex) {
  await knex('crew_assignments').insert([
    // Wedding — crew attended and has been paid their compensation.
    {
      id: 'ca0wedding00010000000001',
      order_id: 'yx3qmnw1pgq114k',
      crew_id: 'zprtbfbw0ff6fyx',
      fee: 300000,
      status: 'completed',
      paid_amount: 300000,
      pending_amount: 0,
      attendance_status: 'hadir',
      attendance_amount: 300000,
      assigned_date: knex.fn.now(),
      assigned_by: '5w5atoldkwg9n4j',
    },
    // Birthday Party — assigned, attendance not yet confirmed.
    {
      id: 'ca0birthday0001000000001',
      order_id: '2aq2ywihm4btacb',
      crew_id: 'zprtbfbw0ff6fyx',
      fee: 200000,
      status: 'pending',
      attendance_status: 'pending',
      assigned_date: knex.fn.now(),
      assigned_by: '5w5atoldkwg9n4j',
    },
  ]);
}
