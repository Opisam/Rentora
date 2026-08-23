import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Op } from 'sequelize';

vi.mock('../../src/models/index.js', () => ({
  Lease: { findAll: vi.fn() },
  RentPayment: {
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const { Lease, RentPayment } = await import('../../src/models/index.js');
const { generateMonthlyRent } = await import('../../src/services/rent.service.js');

beforeEach(() => vi.clearAllMocks());

describe('generateMonthlyRent', () => {
  it('creates a payment only for active leases missing this month’s record', async () => {
    Lease.findAll.mockResolvedValue([
      { id: 1, monthlyRent: 100 },
      { id: 2, monthlyRent: 200 },
    ]);
    RentPayment.findOne
      .mockResolvedValueOnce({ id: 99 }) // lease 1 already has this month's record
      .mockResolvedValueOnce(null);      // lease 2 needs one
    RentPayment.create.mockResolvedValue({});
    RentPayment.update.mockResolvedValue([0]);

    const created = await generateMonthlyRent();

    expect(created).toBe(1);
    expect(RentPayment.create).toHaveBeenCalledTimes(1);
    expect(RentPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({ leaseId: 2, amountDue: 200, status: 'pending' })
    );
    // dueDate must be the 1st of some month in YYYY-MM-DD form
    const arg = RentPayment.create.mock.calls[0][0];
    expect(arg.dueDate).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('marks stale pending payments as late', async () => {
    Lease.findAll.mockResolvedValue([]);
    RentPayment.update.mockResolvedValue([3]);

    const created = await generateMonthlyRent();

    expect(created).toBe(0);
    expect(RentPayment.update).toHaveBeenCalledWith(
      { status: 'late' },
      {
        where: expect.objectContaining({
          status: 'pending',
          dueDate: expect.objectContaining({ [Op.lt]: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
        }),
      }
    );
  });
});
