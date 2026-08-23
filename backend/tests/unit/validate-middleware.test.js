import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../../src/middleware/validate.middleware.js';

function probeApp(chains) {
  const app = express();
  app.use(express.json());
  app.post('/probe', chains, validate, (req, res) => res.json({ ok: true }));
  return app;
}

describe('validate middleware', () => {
  it('passes valid requests through to the handler', async () => {
    const res = await request(probeApp([body('name').notEmpty()]))
      .post('/probe')
      .send({ name: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 with an errors array on validation failure', async () => {
    const res = await request(probeApp([body('name').notEmpty()]))
      .post('/probe')
      .send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors[0].path).toBe('name');
  });
});
