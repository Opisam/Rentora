import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  User, Property, Unit, Application, Lease, RentPayment,
} from '../../src/models/index.js';

export const PASSWORD = 'Test1234!'; // short hash rounds keep the suite fast
const HASH = await bcrypt.hash(PASSWORD, 4);

export async function createUser(overrides = {}) {
  return User.create({
    name: 'Test User',
    email: `user-${Date.now()}-${Math.round(Math.random() * 1e6)}@test.com`,
    password: HASH,
    role: 'tenant',
    ...overrides,
  });
}

export function authHeader(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET
  );
  return { Authorization: `Bearer ${token}` };
}

export async function createProperty(landlordId, overrides = {}) {
  return Property.create({
    name: 'Test Property',
    address: '1 Test Street',
    city: 'Springfield',
    landlordId,
    ...overrides,
  });
}

export async function createUnit(propertyId, overrides = {}) {
  return Unit.create({
    unitNumber: `U${Math.round(Math.random() * 1000)}`,
    bedrooms: 2,
    bathrooms: 1,
    rentAmount: 1000,
    status: 'vacant',
    propertyId,
    ...overrides,
  });
}

export async function createApplication({ unitId, tenantId, status = 'pending', message = null }) {
  return Application.create({ unitId, tenantId, status, message });
}

export async function createLease({ applicationId = null, ...overrides } = {}) {
  return Lease.create({
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    monthlyRent: 1000,
    status: 'active',
    applicationId,
    ...overrides,
  });
}

export async function createRentPayment(leaseId, overrides = {}) {
  return RentPayment.create({
    amountDue: 1000,
    amountPaid: 0,
    dueDate: '2026-08-01',
    status: 'pending',
    leaseId,
    ...overrides,
  });
}
