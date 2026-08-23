import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, authHeader,
} from '../helpers/factories.js';
import { Expense } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB, tenant;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Landlord A' });
  landlordB = await createUser({ role: 'landlord', name: 'Landlord B' });
  tenant = await createUser({ role: 'tenant', name: 'Expense Tenant' });
});

function expenseBody(overrides = {}) {
  return {
    category: 'repairs',
    amount: 250.5,
    date: '2026-07-15',
    description: 'Replaced water heater',
    ...overrides,
  };
}

describe('POST /expenses/:propertyId', () => {
  it('creates an expense on an owned property (201)', async () => {
    const p = await createProperty(landlordA.id);

    const res = await request(app).post(`/expenses/${p.id}`)
      .set(authHeader(landlordA))
      .send(expenseBody());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      propertyId: p.id,
      category: 'repairs',
      amount: '250.50',
      description: 'Replaced water heater',
    });
  });

  it("rejects expenses on someone else's property (403)", async () => {
    const p = await createProperty(landlordB.id);

    const res = await request(app).post(`/expenses/${p.id}`)
      .set(authHeader(landlordA))
      .send(expenseBody());
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown property ids', async () => {
    const res = await request(app).post('/expenses/999999')
      .set(authHeader(landlordA))
      .send(expenseBody());
    expect(res.status).toBe(404);
  });

  it('refuses tenants (403 role gate)', async () => {
    const p = await createProperty(landlordA.id);
    const res = await request(app).post(`/expenses/${p.id}`)
      .set(authHeader(tenant))
      .send(expenseBody());
    expect(res.status).toBe(403);
  });

  it('validates category enum and amount (400)', async () => {
    const p = await createProperty(landlordA.id);

    const badCategory = await request(app).post(`/expenses/${p.id}`)
      .set(authHeader(landlordA))
      .send(expenseBody({ category: 'parties' }));
    expect(badCategory.status).toBe(400);
    expect(badCategory.body.errors).toBeDefined();

    const negative = await request(app).post(`/expenses/${p.id}`)
      .set(authHeader(landlordA))
      .send(expenseBody({ amount: -10 }));
    expect(negative.status).toBe(400);

    const badDate = await request(app).post(`/expenses/${p.id}`)
      .set(authHeader(landlordA))
      .send(expenseBody({ date: 'not-a-date' }));
    expect(badDate.status).toBe(400);
  });
});

describe('GET /expenses/:propertyId', () => {
  let p, newer, older, otherOwners;

  beforeAll(async () => {
    p = await createProperty(landlordA.id);
    newer = await Expense.create({
      propertyId: p.id, category: 'taxes', amount: 1200, date: '2026-06-01',
    });
    older = await Expense.create({
      propertyId: p.id, category: 'utilities', amount: 88.25, date: '2026-02-01',
    });
    otherOwners = await createProperty(landlordB.id);
    await Expense.create({
      propertyId: otherOwners.id, category: 'other', amount: 1, date: '2026-01-01',
    });
  });

  it('lists only that property’s expenses, newest first', async () => {
    const res = await request(app).get(`/expenses/${p.id}`).set(authHeader(landlordA));
    expect(res.status).toBe(200);
    expect(res.body.map(e => e.id)).toEqual([newer.id, older.id]);
    expect(res.body.some(e => e.propertyId === otherOwners.id)).toBe(false);
  });

  it('is owner-scoped (403 for other landlords)', async () => {
    const res = await request(app).get(`/expenses/${p.id}`).set(authHeader(landlordB));
    expect(res.status).toBe(403);
  });
});

describe('DELETE /expenses/:id', () => {
  it('owner deletes and the row is gone (204)', async () => {
    const p = await createProperty(landlordA.id);
    const row = await Expense.create({
      propertyId: p.id, category: 'management_fees', amount: 300, date: '2026-05-01',
    });

    const res = await request(app).delete(`/expenses/${row.id}`).set(authHeader(landlordA));
    expect(res.status).toBe(204);
    expect(await Expense.findByPk(row.id)).toBeNull();
  });

  it("another landlord can't delete (403)", async () => {
    const p = await createProperty(landlordA.id);
    const row = await Expense.create({
      propertyId: p.id, category: 'insurance', amount: 55, date: '2026-04-01',
    });

    const res = await request(app).delete(`/expenses/${row.id}`).set(authHeader(landlordB));
    expect(res.status).toBe(403);
    expect(await Expense.findByPk(row.id)).not.toBeNull();
  });

  it('returns 404 for unknown expense ids', async () => {
    const res = await request(app).delete('/expenses/999999').set(authHeader(landlordA));
    expect(res.status).toBe(404);
  });
});
