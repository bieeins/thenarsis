import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetDatabase, loginAs, authHeader } from './helpers.js';

describe('products CRUD, pagination, filtering', () => {
  let ownerToken;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));

    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post('/api/products')
        .set(authHeader(ownerToken))
        .send({
          package_name: `Package ${i}`,
          base_price: 100 + i,
          category: i % 2 === 0 ? 'Photography' : 'Videography',
        });
    }
  });

  it('creates, lists, updates, and deletes a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set(authHeader(ownerToken))
      .send({ package_name: 'New Package', base_price: 999, category: 'Bundle' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.id;

    const getRes = await request(app).get(`/api/products/${id}`).set(authHeader(ownerToken));
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.package_name).toBe('New Package');

    const updateRes = await request(app)
      .patch(`/api/products/${id}`)
      .set(authHeader(ownerToken))
      .send({ base_price: 1200 });
    expect(updateRes.status).toBe(200);
    expect(Number(updateRes.body.data.base_price)).toBe(1200);

    const deleteRes = await request(app).delete(`/api/products/${id}`).set(authHeader(ownerToken));
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await request(app).get(`/api/products/${id}`).set(authHeader(ownerToken));
    expect(getAfterDelete.status).toBe(404);
  });

  it('paginates results', async () => {
    const res = await request(app)
      .get('/api/products?page=1&perPage=2')
      .set(authHeader(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.perPage).toBe(2);
    expect(res.body.meta.totalItems).toBe(5);
    expect(res.body.meta.totalPages).toBe(3);
  });

  it('filters by category', async () => {
    const res = await request(app)
      .get('/api/products?category=Photography')
      .set(authHeader(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.category === 'Photography')).toBe(true);
  });
});
