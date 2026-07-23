import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';
import { resetDatabase, loginAs, authHeader, waitForAsyncSideEffects } from './helpers.js';

describe('payments', () => {
  let ownerToken;
  let crew;
  let invoiceId;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));
    ({ user: crew } = await loginAs('crew'));

    const productRes = await request(app)
      .post('/api/products')
      .set(authHeader(ownerToken))
      .send({ package_name: 'Payment Package', base_price: 700, category: 'Bundle' });

    const orderRes = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Payment Customer',
        phone_number: '+1-555-7777',
        event_name: 'Payment Event',
        event_date: '2026-12-01',
        event_location: 'Hall',
        product_id: productRes.body.data.id,
        status: 'Confirmed',
      });

    await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderRes.body.data.id, crew_id: crew.id, status: 'pending' });

    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set(authHeader(ownerToken))
      .send({ order_id: orderRes.body.data.id, invoice_number: 'INV-1001', total_amount: 700 });
    invoiceId = invoiceRes.body.data.id;
  });

  it('creates a confirmed payment and notifies assigned crew', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set(authHeader(ownerToken))
      .send({
        invoice_id: invoiceId,
        amount: 700,
        payment_date: '2026-12-02',
        payment_method: 'Bank Transfer',
        payment_status: 'Confirmed',
      });

    expect(res.status).toBe(201);
    await waitForAsyncSideEffects();

    const notifications = await db('notifications').where({ user_id: crew.id, type: 'payment_received' });
    expect(notifications).toHaveLength(1);
  });

  it('does not notify for a pending (unconfirmed) payment', async () => {
    await request(app)
      .post('/api/payments')
      .set(authHeader(ownerToken))
      .send({
        invoice_id: invoiceId,
        amount: 700,
        payment_date: '2026-12-02',
        payment_method: 'Cash',
        payment_status: 'Pending',
      });
    await waitForAsyncSideEffects();

    const notifications = await db('notifications').where({ type: 'payment_received' });
    expect(notifications).toHaveLength(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(401);
  });

  it('rejects a crew member listing payments (owner-only resource)', async () => {
    const { token: crewToken } = await loginAs('crew');
    const res = await request(app).get('/api/payments').set(authHeader(crewToken));
    expect(res.status).toBe(403);
  });
});
