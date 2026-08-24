export async function seed(knex) {
  await knex('invoices').insert([
    // Wedding Ceremony (Confirmed order, Complete Bundle) — fully invoiced.
    { id: 'inv0wedding0001000000001', order_id: 'yx3qmnw1pgq114k', invoice_number: 'INV-2026-0001', total_amount: 1800000 },
    // Corporate Event (Pending order, Premium Videography) — invoiced, awaiting payment.
    { id: 'inv0corporate001000000002', order_id: 'o4dtencpyhotj6y', invoice_number: 'INV-2026-0002', total_amount: 1200000 },
    // Birthday Party (In Progress order, Basic Photography) — partially paid.
    { id: 'inv0birthday0001000000003', order_id: '2aq2ywihm4btacb', invoice_number: 'INV-2026-0003', total_amount: 500000 },
  ]);
}
