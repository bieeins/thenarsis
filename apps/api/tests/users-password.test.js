import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/config/database.js';
import { resetDatabase, loginAs, authHeader, TEST_USERS } from './helpers.js';

describe('owner password reset for team members', () => {
  let ownerToken;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));
  });

  it('lets the owner set a new password, which then works for login and the old one no longer does', async () => {
    const crew = TEST_USERS.crew;
    const res = await request(app)
      .put(`/api/users/${crew.id}/password`)
      .set(authHeader(ownerToken))
      .send({ new_password: 'BrandNewPass123!' });
    expect(res.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: crew.email, password: crew.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({ email: crew.email, password: 'BrandNewPass123!' });
    expect(newLogin.status).toBe(200);
  });

  it('revokes the member\'s existing sessions', async () => {
    const crew = TEST_USERS.crew;
    await loginAs('crew');
    await request(app).put(`/api/users/${crew.id}/password`).set(authHeader(ownerToken)).send({ new_password: 'BrandNewPass123!' });
    const active = await db('sessions').where({ user_id: crew.id }).whereNull('revoked_at');
    expect(active).toHaveLength(0);
  });

  it('rejects short passwords and non-owners', async () => {
    const crew = TEST_USERS.crew;
    const short = await request(app).put(`/api/users/${crew.id}/password`).set(authHeader(ownerToken)).send({ new_password: 'short' });
    expect(short.status).toBe(400);

    const { token: crewToken } = await loginAs('crew');
    const forbidden = await request(app).put(`/api/users/${TEST_USERS.designer.id}/password`).set(authHeader(crewToken)).send({ new_password: 'BrandNewPass123!' });
    expect(forbidden.status).toBe(403);
  });
});
