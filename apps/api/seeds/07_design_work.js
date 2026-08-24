export async function seed(knex) {
  await knex('design_work').insert([
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
  ]);
}
