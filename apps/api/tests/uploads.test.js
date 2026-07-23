import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { app } from '../src/app.js';
import { resetDatabase, loginAs, authHeader } from './helpers.js';

describe('file uploads', () => {
  let ownerToken;

  beforeEach(async () => {
    await resetDatabase();
    ({ token: ownerToken } = await loginAs('owner'));
  });

  afterAll(() => {
    const uploadDir = path.resolve('./uploads');
    if (fs.existsSync(uploadDir)) {
      for (const file of fs.readdirSync(uploadDir)) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    }
  });

  it('accepts a valid file upload', async () => {
    const res = await request(app)
      .post('/api/files')
      .set(authHeader(ownerToken))
      .attach('file', Buffer.from('fake image content'), { filename: 'receipt.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.original_name).toBe('receipt.png');
    expect(res.body.data.stored_name).not.toBe('receipt.png');
  });

  it('rejects a disallowed file type', async () => {
    const res = await request(app)
      .post('/api/files')
      .set(authHeader(ownerToken))
      .attach('file', Buffer.from('#!/bin/sh\necho hi'), { filename: 'script.sh', contentType: 'application/x-sh' });

    expect(res.status).toBe(400);
  });

  it('downloads a file the uploader owns', async () => {
    const uploadRes = await request(app)
      .post('/api/files')
      .set(authHeader(ownerToken))
      .attach('file', Buffer.from('fake image content'), { filename: 'receipt.png', contentType: 'image/png' });

    const downloadRes = await request(app)
      .get(`/api/files/${uploadRes.body.data.id}/download`)
      .set(authHeader(ownerToken));

    expect(downloadRes.status).toBe(200);
  });
});
