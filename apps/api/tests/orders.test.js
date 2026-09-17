import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';
import { resetDatabase, loginAs, authHeader, TEST_USERS, waitForAsyncSideEffects } from './helpers.js';

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

  describe('atomic designer/crew assignment', () => {
    let orderId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set(authHeader(ownerToken))
        .send({
          customer_name: 'Assignment Test', phone_number: '+1-555-0000', event_name: 'Assignment Event',
          event_date: '2026-10-01', event_location: 'Venue', product_id: productId, status: 'Pending',
        });
      orderId = orderRes.body.data.id;
    });

    it('assigns a designer to both orders.assigned_designer_id and design_work in one call', async () => {
      const { user: designer } = await loginAs('designer');

      const res = await request(app)
        .put(`/api/orders/${orderId}/designer`)
        .set(authHeader(ownerToken))
        .send({ designer_id: designer.id });

      expect(res.status).toBe(200);
      expect(res.body.data.assigned_designer_id).toBe(designer.id);

      const designWork = await db('design_work').where({ order_id: orderId }).first();
      expect(designWork).toBeTruthy();
      expect(designWork.designer_id).toBe(designer.id);

      await waitForAsyncSideEffects();
      const notifications = await db('notifications').where({ user_id: designer.id, type: 'assignment' });
      expect(notifications).toHaveLength(1);
    });

    it('re-assigning a designer updates the existing design_work row instead of creating a duplicate', async () => {
      const { user: designer } = await loginAs('designer');
      const otherDesignerRes = await request(app)
        .post('/api/users')
        .set(authHeader(ownerToken))
        .send({ email: 'other-designer@test.local', password: 'OtherDesigner123!', name: 'Other Designer', role: 'designer' });

      await request(app)
        .put(`/api/orders/${orderId}/designer`)
        .set(authHeader(ownerToken))
        .send({ designer_id: designer.id });

      const res = await request(app)
        .put(`/api/orders/${orderId}/designer`)
        .set(authHeader(ownerToken))
        .send({ designer_id: otherDesignerRes.body.data.id });

      expect(res.status).toBe(200);
      expect(res.body.data.assigned_designer_id).toBe(otherDesignerRes.body.data.id);

      const designWorkRows = await db('design_work').where({ order_id: orderId });
      expect(designWorkRows).toHaveLength(1);
      expect(designWorkRows[0].designer_id).toBe(otherDesignerRes.body.data.id);
    });

    it('rejects assigning a non-designer user as designer', async () => {
      const { user: crew } = await loginAs('crew');
      const res = await request(app)
        .put(`/api/orders/${orderId}/designer`)
        .set(authHeader(ownerToken))
        .send({ designer_id: crew.id });

      expect(res.status).toBe(400);
      const order = await db('orders').where({ id: orderId }).first();
      expect(order.assigned_designer_id).toBeNull();
    });

    it('syncs the full crew list for an order in one call, adding and removing in the same request', async () => {
      const { user: crewA } = await loginAs('crew');
      const crewBRes = await request(app)
        .post('/api/users')
        .set(authHeader(ownerToken))
        .send({ email: 'crew-b@test.local', password: 'CrewB12345!', name: 'Crew B', role: 'crew' });
      const crewB = crewBRes.body.data;

      const firstRes = await request(app)
        .put(`/api/orders/${orderId}/crew`)
        .set(authHeader(ownerToken))
        .send({ crew_ids: [crewA.id] });
      expect(firstRes.status).toBe(200);
      expect(firstRes.body.data).toHaveLength(1);

      await waitForAsyncSideEffects();
      expect(await db('notifications').where({ user_id: crewA.id, type: 'assignment' })).toHaveLength(1);

      const secondRes = await request(app)
        .put(`/api/orders/${orderId}/crew`)
        .set(authHeader(ownerToken))
        .send({ crew_ids: [crewB.id] });

      expect(secondRes.status).toBe(200);
      const crewIds = secondRes.body.data.map((row) => row.crew_id);
      expect(crewIds).toEqual([crewB.id]);

      const remaining = await db('crew_assignments').where({ order_id: orderId });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].crew_id).toBe(crewB.id);

      // crewA should not get a second notification just for being removed
      await waitForAsyncSideEffects();
      expect(await db('notifications').where({ user_id: crewA.id, type: 'assignment' })).toHaveLength(1);
      expect(await db('notifications').where({ user_id: crewB.id, type: 'assignment' })).toHaveLength(1);
    });

    it('rejects a non-owner assigning a designer or crew', async () => {
      const { token: designerToken, user: designer } = await loginAs('designer');

      const designerRes = await request(app)
        .put(`/api/orders/${orderId}/designer`)
        .set(authHeader(designerToken))
        .send({ designer_id: designer.id });
      expect(designerRes.status).toBe(403);

      const crewRes = await request(app)
        .put(`/api/orders/${orderId}/crew`)
        .set(authHeader(designerToken))
        .send({ crew_ids: [] });
      expect(crewRes.status).toBe(403);
    });
  });
});
