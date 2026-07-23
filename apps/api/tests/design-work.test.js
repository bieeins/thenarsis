import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';
import { resetDatabase, loginAs, authHeader, waitForAsyncSideEffects } from './helpers.js';

describe('design_work assignment + completion', () => {
  let ownerToken;
  let designer;
  let designerToken;
  let orderId;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));
    ({ user: designer, token: designerToken } = await loginAs('designer'));

    const productRes = await request(app)
      .post('/api/products')
      .set(authHeader(ownerToken))
      .send({ package_name: 'Design Package', base_price: 300, category: 'Photography' });

    const orderRes = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Design Customer',
        phone_number: '+1-555-4444',
        event_name: 'Design Event',
        event_date: '2026-10-01',
        event_location: 'Studio',
        product_id: productRes.body.data.id,
        status: 'Confirmed',
      });
    orderId = orderRes.body.data.id;
  });

  it('assigns a designer and creates a notification for them', async () => {
    const res = await request(app)
      .post('/api/design-work')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, designer_id: designer.id, status: 'pending', design_fee: 200 });

    expect(res.status).toBe(201);
    await waitForAsyncSideEffects();

    const notifications = await db('notifications').where({ user_id: designer.id, type: 'assignment' });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('Design Event');
  });

  it('creates a design_income record when design work is marked completed with a fee, inside one transaction', async () => {
    const createRes = await request(app)
      .post('/api/design-work')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, designer_id: designer.id, status: 'in_progress', design_fee: 250 });
    const designWorkId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/design-work/${designWorkId}`)
      .set(authHeader(designerToken))
      .send({ status: 'completed' });

    expect(updateRes.status).toBe(200);

    const incomeRows = await db('design_income').where({ order_id: orderId, designer_id: designer.id });
    expect(incomeRows).toHaveLength(1);
    expect(Number(incomeRows[0].fee_amount)).toBe(250);
  });

  it('lets a designer view and update only their own design work', async () => {
    const createRes = await request(app)
      .post('/api/design-work')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, designer_id: designer.id, status: 'pending' });
    const designWorkId = createRes.body.data.id;

    const { token: crewToken } = await loginAs('crew');
    const forbiddenUpdate = await request(app)
      .patch(`/api/design-work/${designWorkId}`)
      .set(authHeader(crewToken))
      .send({ status: 'in_progress' });
    // crew can view (broad list rule) but not update someone else's design work
    expect(forbiddenUpdate.status).toBe(403);

    const okUpdate = await request(app)
      .patch(`/api/design-work/${designWorkId}`)
      .set(authHeader(designerToken))
      .send({ status: 'in_progress' });
    expect(okUpdate.status).toBe(200);
  });
});
