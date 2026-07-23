import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetDatabase, TEST_USERS } from './helpers.js';

describe('auth', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USERS.owner.email,
      password: TEST_USERS.owner.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USERS.owner.email);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(res.headers['set-cookie']?.[0]).toMatch(/refresh_token=/);
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USERS.owner.email,
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('refreshes the session using the refresh cookie', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: TEST_USERS.owner.email,
      password: TEST_USERS.owner.password,
    });
    const cookie = loginRes.headers['set-cookie'];

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
  });

  it('revokes the session on logout', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: TEST_USERS.owner.email,
      password: TEST_USERS.owner.password,
    });
    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(401);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for /me', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: TEST_USERS.owner.email,
      password: TEST_USERS.owner.password,
    });
    const token = loginRes.body.data.accessToken;

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(TEST_USERS.owner.email);
  });

  it('rejects a non-owner creating a product (403 for wrong role)', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: TEST_USERS.crew.email,
      password: TEST_USERS.crew.password,
    });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ package_name: 'Test package', base_price: 100, category: 'Other' });

    expect(res.status).toBe(403);
  });
});
