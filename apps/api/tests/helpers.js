import bcrypt from 'bcrypt';
import request from 'supertest';
import { db } from '../src/config/database.js';
import { app } from '../src/app.js';
import { newId } from '../src/utils/id.js';

const TABLES_REVERSE_ORDER = [
  'notes', 'design_income', 'notifications', 'payments', 'crew_assignments',
  'design_work', 'invoices', 'order_items', 'orders', 'expenses', 'products',
  'sessions', 'files', 'users',
];

export const TEST_USERS = {
  owner: { email: 'owner@test.local', password: 'OwnerPass123!', role: 'owner', name: 'Test Owner' },
  designer: { email: 'designer@test.local', password: 'DesignerPass123!', role: 'designer', name: 'Test Designer' },
  crew: { email: 'crew@test.local', password: 'CrewPass123!', role: 'crew', name: 'Test Crew' },
  reviewer: { email: 'reviewer@test.local', password: 'ReviewerPass123!', role: 'design_reviewer', name: 'Test Reviewer' },
};

export async function resetDatabase() {
  for (const table of TABLES_REVERSE_ORDER) {
    await db(table).del();
  }

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const id = newId();
    await db('users').insert({
      id,
      email: user.email,
      password_hash: await bcrypt.hash(user.password, 4),
      name: user.name,
      role: user.role,
      verified: true,
    });
    TEST_USERS[key].id = id;
  }
}

export async function loginAs(role) {
  const user = TEST_USERS[role];
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return { token: res.body.data.accessToken, user: res.body.data.user, cookies: res.headers['set-cookie'] };
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// Notification/email side effects are dispatched fire-and-forget after the
// response is sent (so a slow mailer never blocks the request) — give them a
// beat to land before asserting against the database in tests.
export function waitForAsyncSideEffects(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
