import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, createLease,
  createRentPayment, authHeader,
} from '../helpers/factories.js';
import { Expense } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Report A' });
  landlordB = await createUser({ role: 'landlord', name: 'Report B' });
  const tenantA = await createUser({ email: 'report-tenant-a@test.com' });
  const tenantB = await createUser({ email: 'report-tenant-b@test.com' });

  // A: two properties — P1 (2 units, one leased), P2 (1 unit)
  const p1 = await createProperty(landlordA.id, { name: 'Alpha Heights' });
  const p2 = await createProperty(landlordA.id, { name: 'Beta Court' });
  const u1 = await createUnit(p1.id, { status: 'occupied', rentAmount: 1000 });
  await createUnit(p1.id);
  await createUnit(p2.id);

  const lease = await createLease({ unitId: u1.id, tenantId: tenantA.id });
  await createRentPayment(lease.id, { amountDue: 1200, amountPaid: 1200, status: 'paid', paidDate: '2026-07-01', dueDate: '2026-07-01' });
  await createRentPayment(lease.id, { amountDue: 1000 }); // pending — must be excluded

  await Expense.create({ propertyId: p1.id, category: 'repairs', amount: 300.5, description: 'plumber', date: '2026-07-02' });
  await Expense.create({ propertyId: p2.id, category: 'taxes', amount: 50, description: 'fee', date: '2026-07-03' });

  // B owns data that must never leak into A's reports
  const pb = await createProperty(landlordB.id, { name: 'Gamma (foreign)' });
  const ub = await createUnit(pb.id, { status: 'occupied', rentAmount: 9999 });
  const foreignLease = await createLease({ unitId: ub.id, tenantId: tenantB.id });
  await createRentPayment(foreignLease.id, { amountDue: 5000, amountPaid: 5000, status: 'paid', paidDate: '2026-07-01', dueDate: '2026-07-01' });
  await Expense.create({ propertyId: pb.id, category: 'repairs', amount: 777, description: 'x', date: '2026-07-01' });
});

describe('GET /reports/summary', () => {
  it('computes portfolio totals from only this landlord\'s data', async () => {
    const res = await request(app).get('/reports/summary').set(authHeader(landlordA));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalProperties: 2,
      totalUnits: 3,
      occupiedUnits: 1,
      vacantUnits: 2,
      occupancyRate: '33.3%',
      totalRentCollected: 1200,
      totalExpenses: 350.5,
      netProfit: 849.5,
    });
  });

  it('returns zeros for a landlord with no properties', async () => {
    const empty = await createUser({ role: 'landlord', email: 'empty@test.com' });
    const res = await request(app).get('/reports/summary').set(authHeader(empty));
    expect(res.status).toBe(200);
    expect(res.body.totalProperties).toBe(0);
    expect(res.body.occupancyRate).toBe('0.0%');
  });
});

describe('GET /reports/properties', () => {
  it('breaks profitability down per property with occupancy rates', async () => {
    const res = await request(app).get('/reports/properties').set(authHeader(landlordA));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const alpha = res.body.find((r) => r.propertyName === 'Alpha Heights');
    expect(alpha).toMatchObject({
      totalUnits: 2,
      occupiedUnits: 1,
      occupancyRate: '50.0%',
      totalRentCollected: 1200,
      totalExpenses: 300.5,
      netProfit: 899.5,
    });

    const beta = res.body.find((r) => r.propertyName === 'Beta Court');
    expect(beta).toMatchObject({
      totalUnits: 1,
      occupiedUnits: 0,
      occupancyRate: '0.0%',
      totalRentCollected: 0,
      totalExpenses: 50,
      netProfit: -50,
    });
  });

  it('never includes other landlords\' properties', async () => {
    const res = await request(app).get('/reports/properties').set(authHeader(landlordA));
    expect(res.body.map((r) => r.propertyName)).not.toContain('Gamma (foreign)');
  });
});
