import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit,
  createLease, authHeader,
} from '../helpers/factories.js';
import { MaintenanceRequest, Notification } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB, tenantAnna, tenantBob;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Landlord A' });
  landlordB = await createUser({ role: 'landlord', name: 'Landlord B' });
  tenantAnna = await createUser({ role: 'tenant', name: 'Anna Tenant' });
  tenantBob = await createUser({ role: 'tenant', name: 'Bob Tenant' });
});

describe('POST /maintenance (tenant submits a request)', () => {
  it('creates a request for a unit under an active lease (201)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await createLease({
      unitId: u.id, tenantId: tenantAnna.id, status: 'active',
      startDate: '2026-01-01', endDate: '2027-01-01', monthlyRent: 1000, applicationId: null,
    });

    const res = await request(app).post('/maintenance')
      .set(authHeader(tenantAnna))
      .send({ unitId: u.id, title: 'Leaky kitchen faucet', description: 'Water drips constantly.', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      unitId: u.id, tenantId: tenantAnna.id,
      title: 'Leaky kitchen faucet', priority: 'high', status: 'open',
    });
  });

  it('defaults to medium priority when omitted', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await createLease({
      unitId: u.id, tenantId: tenantAnna.id, status: 'active',
      startDate: '2026-01-01', endDate: '2027-01-01', monthlyRent: 1000, applicationId: null,
    });

    const res = await request(app).post('/maintenance')
      .set(authHeader(tenantAnna))
      .send({ unitId: u.id, title: 'Sticky window', description: 'Will not open.' });

    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('medium');
  });

  it("rejects requests for units the tenant doesn't lease (403)", async () => {
    const p = await createProperty(landlordA.id);
    const strangerUnit = await createUnit(p.id);

    const res = await request(app).post('/maintenance')
      .set(authHeader(tenantBob))
      .send({ unitId: strangerUnit.id, title: 'Not my flat', description: 'Trying my luck.' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/active lease/i);
  });

  it('trusts lease STATUS over dates: past-endDate but still active counts', async () => {
    // Holdover tenants (landlord hasn't renewed yet) must keep maintenance access
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await createLease({
      unitId: u.id, tenantId: tenantBob.id, status: 'active',
      startDate: '2025-01-01', endDate: '2025-12-31', monthlyRent: 900, applicationId: null,
    });

    const res = await request(app).post('/maintenance')
      .set(authHeader(tenantBob))
      .send({ unitId: u.id, title: 'Old dates, live status', description: 'Holdover tenant.' });
    expect(res.status).toBe(201);
  });

  it('rejects a tenant whose lease is no longer active (403)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await createLease({
      unitId: u.id, tenantId: tenantBob.id, status: 'expired',
      startDate: '2025-01-01', endDate: '2025-12-31', monthlyRent: 900, applicationId: null,
    });

    const res = await request(app).post('/maintenance')
      .set(authHeader(tenantBob))
      .send({ unitId: u.id, title: 'Moved out', description: 'Lease marked expired.' });

    expect(res.status).toBe(403);
  });

  it('refuses landlords (403 role gate)', async () => {
    const res = await request(app).post('/maintenance')
      .set(authHeader(landlordA))
      .send({ unitId: 1, title: 'x', description: 'y' });
    expect(res.status).toBe(403);
  });

  it('validates required fields and priority enum (400)', async () => {
    const missing = await request(app).post('/maintenance')
      .set(authHeader(tenantAnna))
      .send({ unitId: 1 });
    expect(missing.status).toBe(400);
    expect(missing.body.errors).toBeDefined();

    const badPriority = await request(app).post('/maintenance')
      .set(authHeader(tenantAnna))
      .send({ unitId: 1, title: 't', description: 'd', priority: 'urgent' });
    expect(badPriority.status).toBe(400);
  });
});

describe('GET /maintenance/mine vs GET /maintenance scoping', () => {
  let annaRequest;

  beforeAll(async () => {
    const pB = await createProperty(landlordB.id);
    const uB = await createUnit(pB.id);
    await createLease({
      unitId: uB.id, tenantId: tenantAnna.id, status: 'active',
      startDate: '2026-01-01', endDate: '2027-01-01', monthlyRent: 1200, applicationId: null,
    });
    annaRequest = await MaintenanceRequest.create({
      unitId: uB.id, tenantId: tenantAnna.id,
      title: 'Heater rattling', description: 'Loud noise at night.', priority: 'low',
    });
  });

  it('tenant sees only their own requests with unit + property joined', async () => {
    const res = await request(app).get('/maintenance/mine').set(authHeader(tenantAnna));
    expect(res.status).toBe(200);
    const mine = res.body.filter(r => r.id === annaRequest.id);
    expect(mine).toHaveLength(1);
    expect(mine[0].unit.property.landlordId).toBe(landlordB.id);

    const bobRes = await request(app).get('/maintenance/mine').set(authHeader(tenantBob));
    expect(bobRes.body.some(r => r.id === annaRequest.id)).toBe(false);
  });

  it('landlord sees requests for own properties only, with tenant info', async () => {
    const res = await request(app).get('/maintenance').set(authHeader(landlordB));
    expect(res.status).toBe(200);
    const match = res.body.find(r => r.id === annaRequest.id);
    expect(match).toBeDefined();
    expect(match.tenant).toMatchObject({ id: tenantAnna.id, email: tenantAnna.email });

    const other = await request(app).get('/maintenance').set(authHeader(landlordA));
    expect(other.body.some(r => r.id === annaRequest.id)).toBe(false);
  });

  it("tenants can't use the landlord listing (403)", async () => {
    const res = await request(app).get('/maintenance').set(authHeader(tenantAnna));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /maintenance/:id/status (landlord decision)', () => {
  let target;

  beforeAll(async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await createLease({
      unitId: u.id, tenantId: tenantAnna.id, status: 'active',
      startDate: '2026-01-01', endDate: '2027-01-01', monthlyRent: 1000, applicationId: null,
    });
    target = await MaintenanceRequest.create({
      unitId: u.id, tenantId: tenantAnna.id,
      title: 'Broken mailbox', description: 'Door will not close.',
    });
  });

  it('owner landlord updates status and notifies the tenant (200)', async () => {
    const notesBefore = await Notification.count({ where: { userId: tenantAnna.id } });

    const res = await request(app).patch(`/maintenance/${target.id}/status`)
      .set(authHeader(landlordA))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');

    const notesAfter = await Notification.count({ where: { userId: tenantAnna.id } });
    expect(notesAfter).toBe(notesBefore + 1);
    const latest = await Notification.findOne({
      where: { userId: tenantAnna.id },
      order: [['createdAt', 'DESC']],
    });
    expect(latest.message).toContain('Broken mailbox');
    expect(latest.message).toContain('in_progress');
  });

  it("another landlord gets 403 even with a valid id", async () => {
    const res = await request(app).patch(`/maintenance/${target.id}/status`)
      .set(authHeader(landlordB))
      .send({ status: 'resolved' });
    expect(res.status).toBe(403);
  });

  it('rejects unknown status values (400)', async () => {
    const res = await request(app).patch(`/maintenance/${target.id}/status`)
      .set(authHeader(landlordA))
      .send({ status: 'closed-forever' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown request ids', async () => {
    const res = await request(app).patch('/maintenance/999999/status')
      .set(authHeader(landlordA))
      .send({ status: 'resolved' });
    expect(res.status).toBe(404);
  });
});
