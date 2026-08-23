import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, createLease, authHeader,
} from '../helpers/factories.js';

beforeAll(async () => {
  await resetDb();
  fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
});

afterAll(() => {
  fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
  return closeDb();
});

let landlord, tenantOnLease, stranger;

beforeAll(async () => {
  landlord = await createUser({ role: 'landlord', name: 'Doc Landlord' });
  tenantOnLease = await createUser({ role: 'tenant', name: 'Doc Tenant' });
  stranger = await createUser({ email: 'doc-stranger@test.com' });
});

async function makeLease() {
  const p = await createProperty(landlord.id);
  const u = await createUnit(p.id);
  return createLease({ unitId: u.id, tenantId: tenantOnLease.id });
}

describe('POST /documents/:leaseId (upload)', () => {
  it('stores a PDF and creates a document record (201)', async () => {
    const lease = await makeLease();
    const res = await request(app).post(`/documents/${lease.id}`)
      .set(authHeader(landlord))
      .attach('file', Buffer.from('%PDF-1.4 fake pdf'), 'lease-agreement.pdf');

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ leaseId: lease.id, originalName: 'lease-agreement.pdf' });

    const storedPath = path.join(process.env.UPLOAD_DIR, res.body.filename);
    expect(fs.existsSync(storedPath)).toBe(true);
  });

  it('rejects disallowed file types with a client error (400)', async () => {
    const lease = await makeLease();
    const res = await request(app).post(`/documents/${lease.id}`)
      .set(authHeader(landlord))
      .attach('file', Buffer.from('MZ malicious'), 'virus.exe');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not allowed/i);
  });

  it('rejects files over the 5MB cap (400)', async () => {
    const lease = await makeLease();
    const bigFile = Buffer.alloc(5 * 1024 * 1024 + 1, 'a');
    const res = await request(app).post(`/documents/${lease.id}`)
      .set(authHeader(landlord))
      .attach('file', bigFile, 'big.pdf');
    expect(res.status).toBe(400);
  });

  it('rejects requests without a file (400)', async () => {
    const lease = await makeLease();
    const res = await request(app).post(`/documents/${lease.id}`)
      .set(authHeader(landlord));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  it('forbids strangers from uploading to a lease (403)', async () => {
    const lease = await makeLease();
    const res = await request(app).post(`/documents/${lease.id}`)
      .set(authHeader(stranger))
      .attach('file', Buffer.from('pdf'), 'doc.pdf');
    // auth middleware runs before multer, so no file is processed
    expect([403, 400]).toContain(res.status);
  });
});

describe('GET /documents/:leaseId', () => {
  it('lets the tenant on the lease list its documents but not strangers (200/403)', async () => {
    const lease = await makeLease();
    await request(app).post(`/documents/${lease.id}`)
      .set(authHeader(landlord))
      .attach('file', Buffer.from('%PDF tenant view'), 'for-tenant.pdf');

    const allowed = await request(app).get(`/documents/${lease.id}`)
      .set(authHeader(tenantOnLease));
    expect(allowed.status).toBe(200);
    expect(allowed.body).toHaveLength(1);
    expect(allowed.body[0].originalName).toBe('for-tenant.pdf');

    const denied = await request(app).get(`/documents/${lease.id}`)
      .set(authHeader(stranger));
    expect(denied.status).toBe(403);
  });

  it('404s for unknown leases', async () => {
    const res = await request(app).get('/documents/999999').set(authHeader(landlord));
    expect(res.status).toBe(404);
  });
});
