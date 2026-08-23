import { describe, it, expect } from 'vitest';
import { validationResult } from 'express-validator';
import { registerValidation, loginValidation } from '../../src/validators/auth.validator.js';
import { propertyValidation, unitValidation } from '../../src/validators/property.validator.js';
import { leaseValidation } from '../../src/validators/lease.validator.js';
import { applicationStatusValidation } from '../../src/validators/application.validator.js';

async function runChains(chains, body) {
  const req = { body, query: {}, params: {}, cookies: {}, headers: {} };
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req);
}

function expectPass(errors, value) {
  expect(errors.isEmpty(), JSON.stringify(errors.array())).toBe(value);
}

describe('registerValidation', () => {
  const valid = { name: 'Jane', email: 'jane@test.com', password: 'LongEnough1!', role: 'tenant' };

  it('accepts a complete valid payload', async () => {
    expectPass(await runChains(registerValidation, valid), true);
  });

  it.each([
    ['missing name', { ...valid, name: '' }],
    ['invalid email', { ...valid, email: 'nope' }],
    ['short password', { ...valid, password: 'short' }],
    ['invalid role', { ...valid, role: 'admin' }],
    ['missing role', { name: 'Jane', email: 'jane@test.com', password: 'LongEnough1!' }],
  ])('rejects %s', async (_label, body) => {
    expectPass(await runChains(registerValidation, body), false);
  });
});

describe('loginValidation', () => {
  it('accepts valid credentials shape', async () => {
    expectPass(await runChains(loginValidation, { email: 'a@b.com', password: 'whatever' }), true);
  });

  it.each([
    ['bad email format', { email: 'nope', password: 'x' }],
    ['missing password', { email: 'a@b.com', password: '' }],
  ])('rejects %s', async (_label, body) => {
    expectPass(await runChains(loginValidation, body), false);
  });
});

describe('propertyValidation', () => {
  it('accepts full payload', async () => {
    expectPass(
      await runChains(propertyValidation, { name: 'P', address: 'A', city: 'C' }),
      true
    );
  });

  it.each([
    ['empty name', { name: '', address: 'A', city: 'C' }],
    ['whitespace address', { name: 'P', address: '   ', city: 'C' }],
    ['missing city', { name: 'P', address: 'A' }],
  ])('rejects %s', async (_label, body) => {
    expectPass(await runChains(propertyValidation, body), false);
  });
});

describe('unitValidation', () => {
  const valid = { unitNumber: '3B', bedrooms: 2, bathrooms: 1, rentAmount: 950 };

  it('accepts boundary values (0 bedrooms, 0 rent)', async () => {
    expectPass(
      await runChains(unitValidation, { ...valid, bedrooms: 0, rentAmount: 0 }),
      true
    );
  });

  it.each([
    ['negative bedrooms', { ...valid, bedrooms: -1 }],
    ['fractional bathrooms', { ...valid, bathrooms: 1.5 }],
    ['negative rent', { ...valid, rentAmount: -100 }],
    ['missing unitNumber', { ...valid, unitNumber: '' }],
  ])('rejects %s', async (_label, body) => {
    expectPass(await runChains(unitValidation, body), false);
  });
});

describe('leaseValidation', () => {
  const valid = {
    applicationId: 5,
    startDate: '2026-09-01',
    endDate: '2027-09-01',
    monthlyRent: 1200,
  };

  it('accepts ISO dates and integer ids', async () => {
    expectPass(await runChains(leaseValidation, valid), true);
  });

  it.each([
    ['non-numeric applicationId', { ...valid, applicationId: 'abc' }],
    ['prose startDate', { ...valid, startDate: 'tomorrow' }],
    ['prose endDate', { ...valid, endDate: 'next year' }],
    ['negative rent', { ...valid, monthlyRent: -1 }],
  ])('rejects %s', async (_label, body) => {
    expectPass(await runChains(leaseValidation, body), false);
  });
});

describe('applicationStatusValidation', () => {
  it.each(['approved', 'rejected'])('accepts %s', async (status) => {
    expectPass(await runChains(applicationStatusValidation, { status }), true);
  });

  it.each(['maybe', '', undefined])('rejects %s', async (status) => {
    expectPass(await runChains(applicationStatusValidation, { status }), false);
  });
});
