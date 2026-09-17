import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';
import { resetDatabase, loginAs, authHeader, waitForAsyncSideEffects } from './helpers.js';

describe('crew_assignments', () => {
  let ownerToken;
  let crew;
  let crewToken;
  let orderId;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));
    ({ user: crew, token: crewToken } = await loginAs('crew'));

    const productRes = await request(app)
      .post('/api/products')
      .set(authHeader(ownerToken))
      .send({ package_name: 'Crew Package', base_price: 400, category: 'Videography' });

    const orderRes = await request(app)
      .post('/api/orders')
      .set(authHeader(ownerToken))
      .send({
        customer_name: 'Crew Customer',
        phone_number: '+1-555-5555',
        event_name: 'Crew Event',
        event_date: '2026-11-01',
        event_location: 'Hall',
        product_id: productRes.body.data.id,
        status: 'Confirmed',
      });
    orderId = orderRes.body.data.id;
  });

  it('assigns crew and sends them a notification', async () => {
    const res = await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: crew.id, status: 'pending' });

    expect(res.status).toBe(201);
    await waitForAsyncSideEffects();

    const notifications = await db('notifications').where({ user_id: crew.id, type: 'assignment' });
    expect(notifications).toHaveLength(1);
  });

  it('rejects assignment referencing a non-existent order or crew member (integrity check)', async () => {
    const res = await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: 'nonexistent-order-id', crew_id: crew.id, status: 'pending' });

    expect(res.status).toBe(400);
  });

  it('lets a crew member record attendance on their own assignment', async () => {
    const createRes = await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: crew.id, status: 'pending' });
    const assignmentId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/crew-assignments/${assignmentId}`)
      .set(authHeader(crewToken))
      .send({ attendance_status: 'confirmed', crew_notes: 'On my way' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.attendance_status).toBe('confirmed');
    expect(updateRes.body.data.attendance_date).toBeTruthy();
  });

  it('forbids a crew member from updating someone else\'s assignment', async () => {
    const otherCrewRes = await request(app)
      .post('/api/users')
      .set(authHeader(ownerToken))
      .send({ email: 'othercrew@test.local', password: 'OtherCrew123!', name: 'Other Crew', role: 'crew' });

    const createRes = await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: otherCrewRes.body.data.id, status: 'pending' });

    const res = await request(app)
      .patch(`/api/crew-assignments/${createRes.body.data.id}`)
      .set(authHeader(crewToken))
      .send({ attendance_status: 'confirmed' });

    expect(res.status).toBe(403);
  });

  it('lets a crew member see teammates on a shared order, without their compensation details', async () => {
    const otherCrewRes = await request(app)
      .post('/api/users')
      .set(authHeader(ownerToken))
      .send({ email: 'teammate@test.local', password: 'Teammate123!', name: 'Teammate Crew', role: 'crew' });

    await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: crew.id, status: 'pending', fee: 200 });

    await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: otherCrewRes.body.data.id, status: 'pending', fee: 350 });

    const listRes = await request(app)
      .get('/api/crew-assignments')
      .query({ orderId })
      .set(authHeader(crewToken));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(2);

    const own = listRes.body.data.find((row) => row.crew_id === crew.id);
    const teammate = listRes.body.data.find((row) => row.crew_id === otherCrewRes.body.data.id);
    expect(own.fee).toBe(200);
    expect(teammate.fee).toBeNull();
  });

  it('does not leak assignments from an order a crew member is not part of', async () => {
    const otherCrewRes = await request(app)
      .post('/api/users')
      .set(authHeader(ownerToken))
      .send({ email: 'unrelated@test.local', password: 'Unrelated123!', name: 'Unrelated Crew', role: 'crew' });

    await request(app)
      .post('/api/crew-assignments')
      .set(authHeader(ownerToken))
      .send({ order_id: orderId, crew_id: otherCrewRes.body.data.id, status: 'pending' });

    const listRes = await request(app)
      .get('/api/crew-assignments')
      .query({ orderId })
      .set(authHeader(crewToken));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(0);
  });
});
