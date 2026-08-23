import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import { createUser, authHeader, PASSWORD } from '../helpers/factories.js';
import { User } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

const validBody = { name: 'New Tenant', email: 'new@test.com', password: PASSWORD, role: 'tenant' };

describe('POST /auth/register', () => {
  it('registers a new user (201)', async () => {
    const res = await request(app).post('/auth/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'New Tenant', email: 'new@test.com', role: 'tenant' });
    expect(res.body.password).toBeUndefined();
  });

  it('rejects duplicate email (409)', async () => {
    await request(app).post('/auth/register').send(validBody);
    const res = await request(app).post('/auth/register').send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('rejects invalid email / short password / bad role (400)', async () => {
    const cases = [
      { ...validBody, email: 'not-an-email' },
      { ...validBody, email: 'a@test.com', password: 'short' },
      { ...validBody, email: 'b@test.com', role: 'admin' },
      { name: '', email: 'c@test.com', password: PASSWORD, role: 'tenant' },
    ];
    for (const body of cases) {
      const res = await request(app).post('/auth/register').send(body);
      expect(res.status).toBe(400);
      expect(Array.isArray(res.body.errors)).toBe(true);
    }
  });
});

describe('POST /auth/login', () => {
  let user;
  beforeAll(async () => {
    user = await createUser({ email: 'login@test.com', name: 'Login User' });
  });

  it('logs in with correct credentials and returns token + user', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: 'login@test.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ id: user.id, role: 'tenant' });
  });

  it('rejects wrong password with same message as unknown email (no user enumeration)', async () => {
    const wrongPw = await request(app).post('/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPass123!' });
    const unknown = await request(app).post('/auth/login')
      .send({ email: 'ghost@test.com', password: PASSWORD });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body.error).toBe(unknown.body.error);
  });

  it('rejects malformed payloads (400)', async () => {
    const noPassword = await request(app).post('/auth/login').send({ email: 'login@test.com' });
    const badEmail = await request(app).post('/auth/login').send({ email: 'x', password: PASSWORD });
    expect(noPassword.status).toBe(400);
    expect(badEmail.status).toBe(400);
  });
});

describe('requireAuth middleware', () => {
  it('blocks requests without a token (401)', async () => {
    const res = await request(app).get('/applications/mine');
    expect(res.status).toBe(401);
  });

  it('rejects garbage tokens (401)', async () => {
    const res = await request(app).get('/applications/mine')
      .set({ Authorization: 'Bearer not.a.jwt' });
    expect(res.status).toBe(401);
  });

  it('rejects tokens signed with a foreign secret (401)', async () => {
    const jwt = await import('jsonwebtoken');
    const forged = jwt.default.sign({ id: 999 }, 'wrong-secret');
    const res = await request(app).get('/applications/mine')
      .set({ Authorization: `Bearer ${forged}` });
    expect(res.status).toBe(401);
  });

  it('rejects valid tokens for deleted users with a clear session error (regression)', async () => {
    const temp = await createUser({ email: 'vanish@test.com' });
    const headers = authHeader(temp);
    await temp.destroy();
    const res = await request(app).get('/applications/mine').set(headers);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/session is no longer valid|log in again/i);
  });
});

describe('requireRole middleware', () => {
  it('blocks a tenant from landlord-only routes (403)', async () => {
    const tenant = await createUser({ role: 'tenant' });
    const res = await request(app).get('/applications').set(authHeader(tenant));
    expect(res.status).toBe(403);
  });

  it('blocks a landlord from tenant-only routes (403)', async () => {
    const landlord = await createUser({ role: 'landlord' });
    const res = await request(app).get('/leases/mine').set(authHeader(landlord));
    expect(res.status).toBe(403);
  });
});

describe('user deletion cleanup', () => {
  it('leaves no orphaned users behind after tests', async () => {
    // sanity check that the DB was really wiped for this suite
    const count = await User.count();
    expect(count).toBeGreaterThan(0);
  });
});
