export async function seed(knex) {
  await knex('expenses').insert([
    { id: 'exp0supplies0001000000001', transaction_date: '2026-08-05', category: 'supplies', amount: 350000, description: 'Memory cards and batteries', uploaded_by_id: '5w5atoldkwg9n4j' },
    { id: 'exp0hosting00001000000002', transaction_date: '2026-08-10', category: 'hosting', amount: 150000, description: 'Monthly cloud storage for client galleries', uploaded_by_id: '5w5atoldkwg9n4j' },
    { id: 'exp0ads000000001000000003', transaction_date: '2026-08-15', category: 'ads', amount: 500000, description: 'Instagram ad campaign', uploaded_by_id: '5w5atoldkwg9n4j' },
    { id: 'exp0domain00001000000004', transaction_date: '2026-07-12', category: 'domain', amount: 250000, description: 'Annual domain renewal', uploaded_by_id: '5w5atoldkwg9n4j' },
    { id: 'exp0equipment01000000005', transaction_date: '2026-07-18', category: 'equipment maintenance', amount: 400000, description: 'Camera sensor cleaning', uploaded_by_id: '5w5atoldkwg9n4j' },
  ]);
}
