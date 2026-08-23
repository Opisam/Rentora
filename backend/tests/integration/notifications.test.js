import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, closeDb } from '../helpers/db.js';
import { app } from '../helpers/api.js';
import {
  createUser, createProperty, createUnit, authHeader as auth,
} from '../helpers/factories.js';
import { Notification } from '../../src/models/index.js';

beforeAll(resetDb);
afterAll(closeDb);

let alice, bob;

beforeAll(async () => {
  alice = await createUser({ email: 'alice@test.com' });
  bob = await createUser({ email: 'bob@test.com' });
});

describe('GET /notifications', () => {
  it('returns only the caller\'s notifications, newest first', async () => {
    await Notification.create({ userId: alice.id, message: 'first note' });
    await Notification.create({ userId: bob.id, message: 'bob private note' });
    await Notification.create({ userId: alice.id, message: 'second note' });

    const res = await request(app).get('/notifications').set(auth(alice));
    expect(res.status).toBe(200);
    expect(res.body.map((n) => n.message)).toEqual(['second note', 'first note']);
  });
});

describe('PATCH /notifications/:id/read', () => {
  it('marks the owner\'s notification as read', async () => {
    const note = await Notification.create({ userId: alice.id, message: 'to be read' });

    const res = await request(app).patch(`/notifications/${note.id}/read`).set(auth(alice));
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);

    const reloaded = await Notification.findByPk(note.id);
    expect(reloaded.isRead).toBe(true);
  });

  it("forbids marking someone else's notification (403)", async () => {
    const note = await Notification.create({ userId: alice.id, message: 'alice only' });
    const res = await request(app).patch(`/notifications/${note.id}/read`).set(auth(bob));
    expect(res.status).toBe(403);
  });

  it('404s for unknown notifications', async () => {
    const res = await request(app).patch('/notifications/999999/read').set(auth(alice));
    expect(res.status).toBe(404);
  });
});
