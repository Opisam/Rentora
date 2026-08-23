import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, createApplication,
  createLease, authHeader,
} from '../helpers/factories.js';
import { Unit } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB, tenant;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Landlord A' });
  landlordB = await createUser({ role: 'landlord', name: 'Landlord B' });
  tenant = await createUser({ role: 'tenant', name: 'Lease Tenant' });
});

function leaseBody(applicationId) {
  return {
    applicationId,
    startDate: '2026-09-01',
    endDate: '2027-09-01',
    monthlyRent: 1150,
  };
}

describe('POST /leases (create from approved application)', () => {
  it('creates a lease from an approved application and occupies the unit (201)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const application = await createApplication({ unitId: u.id, tenantId: tenant.id, status: 'approved' });

    const res = await request(app).post('/leases')
      .set(authHeader(landlordA))
      .send(leaseBody(application.id));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      unitId: u.id, tenantId: tenant.id, applicationId: application.id, status: 'active',
    });

    const unit = await Unit.findByPk(u.id);
    expect(unit.status).toBe('occupied');
  });

  it('refuses leases from pending applications (400)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const application = await createApplication({ unitId: u.id, tenantId: tenant.id, status: 'pending' });

    const res = await request(app).post('/leases')
      .set(authHeader(landlordA))
      .send(leaseBody(application.id));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/approved/i);
  });

  it("forbids creating a lease on another landlord's application (403)", async () => {
    const pb = await createProperty(landlordB.id);
    const ub = await createUnit(pb.id);
    const foreignApp = await createApplication({ unitId: ub.id, tenantId: tenant.id, status: 'approved' });

    const res = await request(app).post('/leases')
      .set(authHeader(landlordA))
      .send(leaseBody(foreignApp.id));
    expect(res.status).toBe(403);
  });

  it('404s for unknown applications and 400s for invalid payloads', async () => {
    const missing = await request(app).post('/leases')
      .set(authHeader(landlordA))
      .send(leaseBody(999999));
    expect(missing.status).toBe(404);

    const bad = await request(app).post('/leases')
      .set(authHeader(landlordA))
      .send({ applicationId: 'abc', startDate: 'tomorrow', endDate: 'yesterday', monthlyRent: -5 });
    expect(bad.status).toBe(400);
  });

  it('blocks tenants from creating leases (403)', async () => {
    const res = await request(app).post('/leases').set(authHeader(tenant)).send({});
    expect(res.status).toBe(403);
  });

  it('rolls back fully when lease creation fails (unit stays vacant)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const application = await createApplication({ unitId: u.id, tenantId: tenant.id, status: 'approved' });

    // DECIMAL(10,2) maxes out at 99,999,999.99 — an absurd rent overflows the
    // column inside the transaction, forcing the rollback path
    const res = await request(app).post('/leases')
      .set(authHeader(landlordA))
      .send({ ...leaseBody(application.id), monthlyRent: 999999999999 });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to create lease/i);

    const unit = await Unit.findByPk(u.id);
    expect(unit.status).toBe('vacant'); // transaction rolled back — nothing leaked
  });
});

describe('lease visibility scoping', () => {
  let scopedTenant, scopedLandlordA, scopedLandlordB, leaseOnA, leaseOnB;

  beforeAll(async () => {
    // fresh actors keep these assertions exact despite leases from earlier suites
    scopedTenant = await createUser({ email: 'scoped-tenant@test.com', name: 'Scoped Tenant' });
    scopedLandlordA = await createUser({ role: 'landlord', email: 'scoped-la@test.com' });
    scopedLandlordB = await createUser({ role: 'landlord', email: 'scoped-lb@test.com' });

    const pa = await createProperty(scopedLandlordA.id, { name: 'Scoped A' });
    const ua = await createUnit(pa.id);
    leaseOnA = await createLease({ unitId: ua.id, tenantId: scopedTenant.id });

    const pb = await createProperty(scopedLandlordB.id, { name: 'Scoped B' });
    const ub = await createUnit(pb.id);
    leaseOnB = await createLease({ unitId: ub.id, tenantId: scopedTenant.id });
  });

  it("GET /leases/mine shows exactly the tenant's leases with nested property", async () => {
    const res = await request(app).get('/leases/mine').set(authHeader(scopedTenant));
    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.id)).toEqual([leaseOnA.id, leaseOnB.id]);
    expect(res.body[0].unit.property.name).toBe('Scoped A');
  });

  it('GET /leases scopes to the owning landlord only', async () => {
    const mine = await request(app).get('/leases').set(authHeader(scopedLandlordA));
    expect(mine.status).toBe(200);
    expect(mine.body.map((l) => l.id)).toEqual([leaseOnA.id]);
  });
});

describe('PATCH /leases/:id/terminate', () => {
  it('terminates a lease and re-opens the unit (vacant)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id, { status: 'occupied' });
    const lease = await createLease({ unitId: u.id, tenantId: tenant.id });

    const res = await request(app).patch(`/leases/${lease.id}/terminate`)
      .set(authHeader(landlordA));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('terminated');

    const unit = await Unit.findByPk(u.id);
    expect(unit.status).toBe('vacant');
  });

  it("forbids terminating someone else's lease (403) and unknown ids (404)", async () => {
    const p = await createProperty(landlordB.id);
    const u = await createUnit(p.id);
    const lease = await createLease({ unitId: u.id, tenantId: tenant.id });

    const foreign = await request(app).patch(`/leases/${lease.id}/terminate`)
      .set(authHeader(landlordA));
    expect(foreign.status).toBe(403);

    const missing = await request(app).patch('/leases/999999/terminate')
      .set(authHeader(landlordA));
    expect(missing.status).toBe(404);
  });
});
