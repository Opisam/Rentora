import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, authHeader,
} from '../helpers/factories.js';

beforeAll(resetDb);
afterAll(closeDb);

let tenant;

beforeAll(async () => {
  const landlord = await createUser({ role: 'landlord', email: 'sec-landlord@test.com' });
  tenant = await createUser({ email: 'sec-tenant@test.com' });
  const p = await createProperty(landlord.id);
  await createUnit(p.id);
});

describe('security headers (helmet)', () => {
  it('sets hardened response headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});

describe('CORS', () => {
  it('echoes an allowed origin', async () => {
    const res = await request(app).get('/health')
      .set({ Origin: 'http://localhost:5173' });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('withholds CORS headers for unknown origins', async () => {
    const res = await request(app).get('/health')
      .set({ Origin: 'http://evil.example.com' });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('XSS sanitization of stored input', () => {
  it('strips script tags from persisted user content', async () => {
    const units = (await request(app).get('/properties/units/vacant')).body;
    expect(units.length).toBeGreaterThan(0);

    const res = await request(app).post(`/applications/units/${units[0].id}/apply`)
      .set(authHeader(tenant))
      .send({ message: '<script>alert(1)</script>Hello <b>world</b>' });

    expect(res.status).toBe(201);
    expect(res.body.message).not.toContain('<script>');
    expect(res.body.message).toContain('Hello');
  });
});

describe('request body handling edge cases (Express 5 regressions)', () => {
  let unitId;

  beforeAll(async () => {
    const landlord = await createUser({ role: 'landlord', email: 'sec-landlord-2@test.com' });
    const p = await createProperty(landlord.id);
    unitId = (await createUnit(p.id)).id;
  });

  it('accepts JSON object bodies normally (201)', async () => {
    const res = await request(app).post(`/applications/units/${unitId}/apply`)
      .set(authHeader(tenant))
      .send({ message: 'proper json body' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('proper json body');
  });

  it('tolerates empty bodies with json content-type (201)', async () => {
    const otherTenant = await createUser({ email: 'sec-empty-body@test.com' });
    const res = await request(app)
      .post(`/applications/units/${unitId}/apply`)
      .set(authHeader(otherTenant))
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(201);
    expect(res.body.message).toBeNull();
  });

  it('rejects payloads over the 10kb JSON cap (413)', async () => {
    const anotherTenant = await createUser({ email: 'sec-bigbody@test.com' });
    const bigMessage = 'x'.repeat(11 * 1024);
    const res = await request(app)
      .post(`/applications/units/${unitId}/apply`)
      .set(authHeader(anotherTenant))
      .set('Content-Type', 'application/json')
      .send({ message: bigMessage });
    expect(res.status).toBe(413);
  });
});

describe('information disclosure', () => {
  it('never echoes stack traces or raw errors in error responses', async () => {
    const res = await request(app).get('/applications/mine')
      .set({ Authorization: 'Bearer garbage.token.value' });
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toMatch(/at\s+\w+\s+\(|node_modules|Sequelize/i);
  });

  it('keeps login failures non-specific', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: 'nobody@nowhere.test', password: 'Whatever123!' });
    expect(res.body.error).toBe('Invalid email or password');
  });
});
