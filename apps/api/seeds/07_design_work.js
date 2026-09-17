export async function seed(knex) {
  const designWorkRows = [
    // Wedding album — finished and fee submitted.
    {
      id: 'dw0wedding00010000000001',
      order_id: 'yx3qmnw1pgq114k',
      designer_id: 't1ru9d7pqhqdx86',
      design_notes: 'Wedding album layout finalized, delivered to client.',
      status: 'completed',
      design_fee: 200000,
      design_file_link: 'https://drive.google.com/example-wedding-album',
      assigned_date: knex.fn.now(),
      assigned_by: '5w5atoldkwg9n4j',
      fee_submitted_date: '2026-06-01',
    },
    // Corporate event highlight reel — still in progress.
    {
      id: 'dw0corporate01000000002',
      order_id: 'o4dtencpyhotj6y',
      designer_id: 't1ru9d7pqhqdx86',
      design_notes: 'Editing highlight reel from raw footage.',
      status: 'in_progress',
      design_fee: 150000,
      assigned_date: knex.fn.now(),
      assigned_by: '5w5atoldkwg9n4j',
    },
  ];

  await knex('design_work').insert(designWorkRows);

  // Keep orders.assigned_designer_id in sync with the design_work rows
  // above — this is what the real "Assign Designer" flow always does
  // atomically (see ordersService.assignDesigner), so seed data should
  // reflect the same invariant instead of only setting one side of it.
  for (const row of designWorkRows) {
    await knex('orders').where({ id: row.order_id }).update({ assigned_designer_id: row.designer_id });
  }
}
