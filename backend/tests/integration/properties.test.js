import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, authHeader,
} from '../helpers/factories.js';

beforeAll(resetDb);
afterAll(closeDb);

let landlordA, landlordB, tenant;

beforeAll(async () => {
  landlordA = await createUser({ role: 'landlord', name: 'Landlord A' });
  landlordB = await createUser({ role: 'landlord', name: 'Landlord B' });
  tenant = await createUser({ role: 'tenant' });
});

describe('GET /properties/units/vacant (public)', () => {
  it('lists only vacant units with limited property fields, no auth needed', async () => {
    const p = await createProperty(landlordA.id, { name: 'Vacant Row' });
    await createUnit(p.id);
    await createUnit(p.id, { status: 'occupied' });

    const res = await request(app).get('/properties/units/vacant');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('vacant');
    expect(res.body[0].property).toEqual({
      name: 'Vacant Row',
      address: '1 Test Street',
      city: 'Springfield',
    });
    // must not leak the landlord id through the included property
    expect(res.body[0].property.landlordId).toBeUndefined();
  });
});

describe('property CRUD (landlord)', () => {
  it('creates a property (201)', async () => {
    const res = await request(app).post('/properties')
      .set(authHeader(landlordA))
      .send({ name: 'Maple Court', address: '42 Maple Ave', city: 'Springfield' });
    expect(res.status).toBe(201);
    expect(res.body.landlordId).toBe(landlordA.id);
  });

  it('rejects invalid payloads (400)', async () => {
    const res = await request(app).post('/properties')
      .set(authHeader(landlordA))
      .send({ name: '', address: '', city: '' });
    expect(res.status).toBe(400);
  });

  it('blocks anonymous and tenant users (401/403)', async () => {
    const anon = await request(app).get('/properties');
    expect(anon.status).toBe(401);

    const tenantRes = await request(app).post('/properties')
      .set(authHeader(tenant))
      .send({ name: 'Nope', address: 'x', city: 'y' });
    expect(tenantRes.status).toBe(403);
  });

  it('scopes "my properties" to the owning landlord', async () => {
    const mine = await request(app).get('/properties').set(authHeader(landlordA));
    const theirs = await request(app).get('/properties').set(authHeader(landlordB));
    expect(mine.body.every((p) => p.landlordId === landlordA.id)).toBe(true);
    expect(theirs.body).toHaveLength(0);
  });

  it('hides other landlords\' properties by id (403) but allows the owner', async () => {
    const p = await createProperty(landlordB.id);
    const foreign = await request(app).get(`/properties/${p.id}`).set(authHeader(landlordA));
    expect(foreign.status).toBe(403);

    const owner = await request(app).get(`/properties/${p.id}`).set(authHeader(landlordB));
    expect(owner.status).toBe(200);
    expect(owner.body.id).toBe(p.id);
  });

  it('updates a property the owner owns (200)', async () => {
    const p = await createProperty(landlordA.id);
    const res = await request(app).put(`/properties/${p.id}`)
      .set(authHeader(landlordA))
      .send({ name: 'Renamed Court', address: '42 Maple Ave', city: 'Springfield' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed Court');
  });

  it('deletes a property and cascades its units', async () => {
    const p = await createProperty(landlordA.id);
    const u = await createUnit(p.id);
    const del = await request(app).delete(`/properties/${p.id}`).set(authHeader(landlordA));
    expect(del.status).toBe(204);

    const check = await request(app).get('/properties/units/vacant');
    expect(check.body.find((unit) => unit.id === u.id)).toBeUndefined();
  });
});

describe('unit CRUD nested under properties', () => {
  let propertyOfB;

  beforeAll(async () => {
    propertyOfB = await createProperty(landlordB.id, { name: 'B Estates' });
  });

  it('creates a unit under an owned property (201)', async () => {
    const res = await request(app).post(`/properties/${propertyOfB.id}/units`)
      .set(authHeader(landlordB))
      .send({ unitNumber: '7C', bedrooms: 2, bathrooms: 1, rentAmount: 1250.5 });
    expect(res.status).toBe(201);
    expect(res.body.rentAmount).toBe('1250.50'); // DECIMAL comes back as string
  });

  it('rejects invalid unit payloads (400)', async () => {
    const bad = await request(app).post(`/properties/${propertyOfB.id}/units`)
      .set(authHeader(landlordB))
      .send({ unitNumber: '', bedrooms: -2, bathrooms: 1.5, rentAmount: -10 });
    expect(bad.status).toBe(400);
  });

  it("forbids creating units in someone else's property (403)", async () => {
    const res = await request(app).post(`/properties/${propertyOfB.id}/units`)
      .set(authHeader(landlordA))
      .send({ unitNumber: '9Z', bedrooms: 1, bathrooms: 1, rentAmount: 500 });
    expect(res.status).toBe(403);
  });

  it("forbids updating/deleting someone else's unit (403)", async () => {
    const u = await createUnit(propertyOfB.id);
    const upd = await request(app).put(`/properties/units/${u.id}`)
      .set(authHeader(landlordA))
      .send({ unitNumber: '9Z', bedrooms: 1, bathrooms: 1, rentAmount: 1 });
    expect(upd.status).toBe(403);

    const del = await request(app).delete(`/properties/units/${u.id}`)
      .set(authHeader(landlordA));
    expect(del.status).toBe(403);
  });

  it('owner can update and delete their own unit', async () => {
    const u = await createUnit(propertyOfB.id);
    const upd = await request(app).put(`/properties/units/${u.id}`)
      .set(authHeader(landlordB))
      .send({ unitNumber: u.unitNumber, bedrooms: u.bedrooms, bathrooms: u.bathrooms, rentAmount: 999.99 });
    expect(upd.status).toBe(200);
    // update() echoes the assigned JS value back without a DB round-trip
    expect(Number(upd.body.rentAmount)).toBe(999.99);

    const del = await request(app).delete(`/properties/units/${u.id}`)
      .set(authHeader(landlordB));
    expect(del.status).toBe(204);
  });
});
