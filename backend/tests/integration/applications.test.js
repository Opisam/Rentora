import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, createApplication, authHeader,
} from '../helpers/factories.js';
import { Notification } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB, tenant;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Landlord A' });
  landlordB = await createUser({ role: 'landlord', name: 'Landlord B' });
  tenant = await createUser({ role: 'tenant', name: 'Jane Applicant' });
});

describe('POST /applications/units/:unitId/apply', () => {
  it('creates a pending application and notifies the landlord (201)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);

    const res = await request(app).post(`/applications/units/${u.id}/apply`)
      .set(authHeader(tenant))
      .send({ message: 'Very interested!' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'pending', unitId: u.id, tenantId: tenant.id });

    const note = await Notification.findOne({ where: { userId: landlordA.id } });
    expect(note.message).toContain(`Unit ${u.unitNumber}`);
  });

  it('rejects a second pending application for the same unit (409)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await request(app).post(`/applications/units/${u.id}/apply`)
      .set(authHeader(tenant)).send({ message: 'first' });

    const res = await request(app).post(`/applications/units/${u.id}/apply`)
      .set(authHeader(tenant)).send({ message: 'second' });
    expect(res.status).toBe(409);
  });

  it("allows a different tenant to apply to the same unit (201)", async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    await request(app).post(`/applications/units/${u.id}/apply`)
      .set(authHeader(tenant)).send({});

    const other = await createUser({ email: 'other-applicant@test.com' });
    const res = await request(app).post(`/applications/units/${u.id}/apply`)
      .set(authHeader(other)).send({});
    expect(res.status).toBe(201);
  });

  it('rejects applications to occupied (400) or nonexistent units (404)', async () => {
    const p = await createProperty(landlordA.id);
    const occupied = await createUnit(p.id, { status: 'occupied' });

    const badUnit = await request(app).post(`/applications/units/${occupied.id}/apply`)
      .set(authHeader(tenant)).send({});
    expect(badUnit.status).toBe(400);

    const missing = await request(app).post('/applications/units/999999/apply')
      .set(authHeader(tenant)).send({});
    expect(missing.status).toBe(404);
  });

  it('blocks landlords from applying (403)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const res = await request(app).post(`/applications/units/${u.id}/apply`)
      .set(authHeader(landlordB)).send({});
    expect(res.status).toBe(403);
  });

  // regression: Express 5 leaves req.body undefined for non-JSON bodies — must not 500
  it('survives raw string bodies without crashing (201, message null)', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);

    const res = await request(app)
      .post(`/applications/units/${u.id}/apply`)
      .set(authHeader(tenant))
      .set('Content-Type', 'text/plain')
      .send('I am a plain string');
    expect(res.status).toBe(201);
    expect(res.body.message).toBeNull();
  });
});

describe('GET /applications/mine (tenant)', () => {
  it("returns only the tenant's own applications with unit + property", async () => {
    const p = await createProperty(landlordA.id);
    const u1 = await createUnit(p.id);
    const mine = await createApplication({ unitId: u1.id, tenantId: tenant.id });
    const stranger = await createUser({ email: 'stranger@test.com' });
    const notMine = await createApplication({ unitId: u1.id, tenantId: stranger.id });

    const res = await request(app).get('/applications/mine').set(authHeader(tenant));
    expect(res.status).toBe(200);
    const ids = res.body.map((a) => a.id);
    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(notMine.id);
    expect(res.body[0].unit.property.name).toBe(p.name);
  });
});

describe('GET /applications (landlord)', () => {
  it("returns only applications for this landlord's properties with tenant info", async () => {
    // fresh landlords keep the assertion exact despite rows from earlier suites
    const scopedLandlord = await createUser({ role: 'landlord', email: 'scoped-ll@test.com' });
    const otherLandlord = await createUser({ role: 'landlord', email: 'scoped-other@test.com' });

    const pa = await createProperty(scopedLandlord.id, { name: 'A Blocks' });
    const pb = await createProperty(otherLandlord.id, { name: 'B Blocks' });
    const ua = await createUnit(pa.id);
    const ub = await createUnit(pb.id);

    const appA = await createApplication({ unitId: ua.id, tenantId: tenant.id });
    await createApplication({ unitId: ub.id, tenantId: tenant.id }); // noise

    const res = await request(app).get('/applications').set(authHeader(scopedLandlord));
    expect(res.status).toBe(200);
    expect(res.body.map((a) => a.id)).toEqual([appA.id]);
    expect(res.body[0].tenant.email).toBe(tenant.email);
  });
});

describe('PATCH /applications/:id/status', () => {
  let propertyOfA;

  beforeAll(async () => {
    propertyOfA = await createProperty(landlordA.id);
  });

  it('approves an application and notifies the tenant', async () => {
    const u = await createUnit(propertyOfA.id);
    const application = await createApplication({ unitId: u.id, tenantId: tenant.id });

    const res = await request(app).patch(`/applications/${application.id}/status`)
      .set(authHeader(landlordA))
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');

    const note = await Notification.findOne({
      where: { userId: tenant.id },
      order: [['id', 'DESC']],
    });
    expect(note.message).toContain('approved');
  });

  it('rejects invalid status values (400)', async () => {
    const u = await createUnit(propertyOfA.id);
    const application = await createApplication({ unitId: u.id, tenantId: tenant.id });
    const res = await request(app).patch(`/applications/${application.id}/status`)
      .set(authHeader(landlordA))
      .send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });

  it("forbids a foreign landlord from deciding someone else's application (403)", async () => {
    const u = await createUnit(propertyOfA.id);
    const application = await createApplication({ unitId: u.id, tenantId: tenant.id });
    const res = await request(app).patch(`/applications/${application.id}/status`)
      .set(authHeader(landlordB))
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown applications', async () => {
    const res = await request(app).patch('/applications/999999/status')
      .set(authHeader(landlordA))
      .send({ status: 'rejected' });
    expect(res.status).toBe(404);
  });
});
