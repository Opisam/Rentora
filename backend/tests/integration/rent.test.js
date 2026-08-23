import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, createLease,
  createRentPayment, authHeader,
} from '../helpers/factories.js';
import { RentPayment, Notification } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB, tenantA, tenantB;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Landlord A' });
  landlordB = await createUser({ role: 'landlord', name: 'Landlord B' });
  tenantA = await createUser({ role: 'tenant', name: 'Tenant A' });
  tenantB = await createUser({ role: 'tenant', name: 'Tenant B' });
});

describe('POST /rent/generate', () => {
  let activeLease;

  beforeAll(async () => {
    const p = await createProperty(landlordA.id);
    const u1 = await createUnit(p.id);
    const u2 = await createUnit(p.id);
    activeLease = await createLease({ unitId: u1.id, tenantId: tenantA.id });
    await createLease({ unitId: u2.id, tenantId: tenantB.id, status: 'terminated' });
  });

  it('generates one payment per ACTIVE lease (terminated leases excluded)', async () => {
    const res = await request(app).post('/rent/generate').set(authHeader(landlordA));
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Generated 1 rent records/);

    const payments = await RentPayment.findAll();
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      leaseId: activeLease.id,
      amountDue: '1000.00',
    });
    // the payment is dated the 1st of the current month — when triggered after
    // the 1st it is already past due, so the service legitimately flags it late
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const firstOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    expect(payments[0].status).toBe(firstOfMonth < iso ? 'late' : 'pending');
  });

  it('is idempotent — a second run creates nothing new', async () => {
    const res = await request(app).post('/rent/generate').set(authHeader(landlordA));
    expect(res.body.message).toMatch(/Generated 0 rent records/);
    expect(await RentPayment.count()).toBe(1);
  });

  it('marks stale pending payments as late during generation', async () => {
    const stale = await createRentPayment(activeLease.id, { dueDate: '2020-01-01' });

    await request(app).post('/rent/generate').set(authHeader(landlordA));

    const reloaded = await RentPayment.findByPk(stale.id);
    expect(reloaded.status).toBe('late');
  });

  it('blocks tenants from triggering generation (403)', async () => {
    const res = await request(app).post('/rent/generate').set(authHeader(tenantA));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /rent/:id/pay', () => {
  it("owner marks a payment paid: fields set + tenant notified", async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const lease = await createLease({ unitId: u.id, tenantId: tenantA.id });
    const payment = await createRentPayment(lease.id);

    const res = await request(app).patch(`/rent/${payment.id}/pay`)
      .set(authHeader(landlordA));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'paid', amountPaid: '1000.00' });
    expect(res.body.paidDate).toBeTruthy();

    const note = await Notification.findOne({
      where: { userId: tenantA.id },
      order: [['id', 'DESC']],
    });
    expect(note.message).toContain('$1000.00');
  });

  it("forbids a foreign landlord (403) and unknown payments (404)", async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const lease = await createLease({ unitId: u.id, tenantId: tenantA.id });
    const payment = await createRentPayment(lease.id);

    const foreign = await request(app).patch(`/rent/${payment.id}/pay`)
      .set(authHeader(landlordB));
    expect(foreign.status).toBe(403);

    const missing = await request(app).patch('/rent/999999/pay')
      .set(authHeader(landlordA));
    expect(missing.status).toBe(404);
  });

  it('blocks tenants from marking payments paid (403)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const lease = await createLease({ unitId: u.id, tenantId: tenantA.id });
    const payment = await createRentPayment(lease.id);

    const res = await request(app).patch(`/rent/${payment.id}/pay`)
      .set(authHeader(tenantA));
    expect(res.status).toBe(403);
  });
});

describe('rent history scoping', () => {
  it("GET /rent/mine returns only the tenant's payments, newest first", async () => {
    // fresh tenant isolates this assertion from payments created by earlier suites
    const histTenant = await createUser({ email: 'hist-tenant@test.com' });
    const histLandlord = await createUser({ role: 'landlord', email: 'hist-ll@test.com' });
    const p = await createProperty(histLandlord.id);
    const u = await createUnit(p.id);
    const lease = await createLease({ unitId: u.id, tenantId: histTenant.id });
    await createRentPayment(lease.id, { dueDate: '2026-07-01', status: 'paid', amountPaid: 1000, paidDate: '2026-07-01' });
    await createRentPayment(lease.id, { dueDate: '2026-08-01' });

    const res = await request(app).get('/rent/mine').set(authHeader(histTenant));
    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.dueDate)).toEqual(['2026-08-01', '2026-07-01']);
  });

  it("GET /rent scopes the landlord to payments on their own properties", async () => {
    const scopeLlA = await createUser({ role: 'landlord', email: 'scope-a@test.com' });
    const scopeLlB = await createUser({ role: 'landlord', email: 'scope-b@test.com' });
    const tenantX = await createUser({ email: 'scope-tx@test.com' });
    const tenantY = await createUser({ email: 'scope-ty@test.com' });

    const pa = await createProperty(scopeLlA.id);
    const ua = await createUnit(pa.id);
    const leaseA = await createLease({ unitId: ua.id, tenantId: tenantX.id });
    const mine = await createRentPayment(leaseA.id);

    const pb = await createProperty(scopeLlB.id);
    const ub = await createUnit(pb.id);
    const leaseB = await createLease({ unitId: ub.id, tenantId: tenantY.id });
    const foreign = await createRentPayment(leaseB.id);

    const res = await request(app).get('/rent').set(authHeader(scopeLlA));
    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.id)).toEqual([mine.id]);
    expect(res.body.map((r) => r.id)).not.toContain(foreign.id);
  });
});
