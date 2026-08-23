import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// This file proves auth rate limiting works. It must run the app with a tiny
// RATE_LIMIT_AUTH_MAX, but .env.test sets a huge value — so override BEFORE
// importing app. Static imports would hoist above that override, hence dynamic.
process.env.RATE_LIMIT_AUTH_MAX = '3';

const { default: app } = await import('../../src/app.js');
const { resetDb, closeDb } = await import('../helpers/db.js');

beforeAll(() => resetDb());
afterAll(() => closeDb());

describe('auth rate limiting', () => {
  it('returns 429 after the configured number of attempts per window', async () => {
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: `ratelimit-${i}@test.com`, password: 'Whatever123!' });
      statuses.push(res.status);
    }
    expect(statuses).toEqual([401, 401, 401, 429]);
  });
});
