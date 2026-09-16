import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';
import { resetDatabase, loginAs, authHeader, TEST_USERS } from './helpers.js';

async function createProduct(ownerToken) {
  const res = await request(app)
    .post('/api/products')
    .set(authHeader(ownerToken))
    .send({ package_name: 'Wedding Bundle', base_price: 500, category: 'Bundle' });
  return res.body.data.id;
}

describe('orders + order_items', () => {
  let ownerToken;
  let productId;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));
    productId = await createProduct(ownerToken);
  });

  it('creates an order together with its order items in one transaction', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Jane Doe',
        phone_number: '+1-555-1234',
        event_name: 'Anniversary Party',
        event_date: '2026-09-01',
        event_location: 'Beach Resort',
        product_id: productId,
        status: 'Pending',
        items: [
          { product_id: productId, base_price: 500, quantity: 1 },
          { product_id: productId, base_price: 500, adjusted_price: 450, quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    const orderId = res.body.data.id;

    const items = await db('order_items').where({ order_id: orderId });
    expect(items).toHaveLength(2);
  });

  it('rolls back the whole order when an item insert is invalid', async () => {
    const beforeCount = await db('orders').count({ count: '*' }).first();

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Bad Order',
        phone_number: '+1-555-9999',
        event_name: 'Broken Event',
        event_date: '2026-09-01',
        event_location: 'Nowhere',
        product_id: productId,
        status: 'Pending',
        // references a product that does not exist — FK violation inside the transaction
        items: [{ product_id: 'does-not-exist-id', base_price: 500, quantity: 1 }],
      });

    expect(res.status).toBe(500);

    const afterCount = await db('orders').count({ count: '*' }).first();
    expect(Number(afterCount.count)).toBe(Number(beforeCount.count));
  });

  it('scopes order visibility for a designer to their own assigned orders', async () => {
    const { user: designer, token: designerToken } = await loginAs('designer');

    const assignedOrderRes = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Assigned Customer',
        phone_number: '+1-555-0001',
        event_name: 'Assigned Event',
        event_date: '2026-09-01',
        event_location: 'Venue A',
        product_id: productId,
        assigned_designer_id: designer.id,
        status: 'Pending',
      });

    await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Other Customer',
        phone_number: '+1-555-0002',
        event_name: 'Other Event',
        event_date: '2026-09-02',
        event_location: 'Venue B',
        product_id: productId,
        status: 'Pending',
      });

    const listRes = await request(app).get('/api/orders').set(authHeader(designerToken));
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(assignedOrderRes.body.data.id);
  });

  it('rejects order creation from a non-owner', async () => {
    const { token: crewToken } = await loginAs('crew');
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(crewToken))
      .send({
        customer_name: 'X', phone_number: '1', event_name: 'X', event_date: '2026-01-01',
        event_location: 'X', product_id: productId, status: 'Pending',
      });
    expect(res.status).toBe(403);
  });

  it('deletes an order together with its invoice, payment, and crew assignment in one transaction', async () => {
    const { user: crew } = await loginAs('crew');

    const orderRes = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'To Be Deleted',
        phone_number: '+1-555-4321',
        event_name: 'Deletable Event',
        event_date: '2026-09-05',
        event_location: 'Somewhere',
        product_id: productId,
        status: 'Pending',
        items: [{ product_id: productId, base_price: 500, quantity: 1 }],
      });
    const orderId = orderRes.body.data.id;

    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, invoice_number: 'INV-DELETE-1', total_amount: 500 });
    const invoiceId = invoiceRes.body.data.id;

    await request(app)
      .post('/api/payments')
      .set(authHeader(ownerToken))
      .send({
        invoice_id: invoiceId, amount: 500, payment_date: '2026-09-01',
        payment_method: 'Cash', payment_status: 'Confirmed',
      });

    await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: crew.id, status: 'pending' });

    const deleteRes = await request(app).delete(`/api/orders/${orderId}`).set(authHeader(ownerToken));
    expect(deleteRes.status).toBe(200);

    expect(await db('orders').where({ id: orderId }).first()).toBeUndefined();
    expect(await db('order_items').where({ order_id: orderId })).toHaveLength(0);
    expect(await db('invoices').where({ order_id: orderId })).toHaveLength(0);
    expect(await db('payments').where({ invoice_id: invoiceId })).toHaveLength(0);
    expect(await db('crew_assignments').where({ order_id: orderId })).toHaveLength(0);
  });
});
