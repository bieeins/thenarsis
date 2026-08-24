export async function seed(knex) {
  await knex('payments').insert([
    // Wedding Ceremony — invoice fully settled in one bank transfer.
    {
      id: 'pay0wedding0001000000001',
      invoice_id: 'inv0wedding0001000000001',
      amount: 1800000,
      payment_date: '2026-05-20',
      payment_method: 'Bank Transfer',
      payment_status: 'Confirmed',
    },
    // Birthday Party — partial cash down payment, balance still outstanding.
    {
      id: 'pay0birthday0001000000001',
      invoice_id: 'inv0birthday0001000000003',
      amount: 250000,
      payment_date: '2026-07-02',
      payment_method: 'Cash',
      payment_status: 'Confirmed',
    },
    // Corporate Event has an outstanding, unconfirmed transfer awaiting verification.
    {
      id: 'pay0corporate001000000002',
      invoice_id: 'inv0corporate001000000002',
      amount: 1200000,
      payment_date: '2026-07-24',
      payment_method: 'Bank Transfer',
      payment_status: 'Pending',
    },
  ]);
}
