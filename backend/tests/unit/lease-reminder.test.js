import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/lease.model.js', () => ({
  default: { findAll: vi.fn() },
}));
vi.mock('../../src/services/notification.services.js', () => ({
  notify: vi.fn(),
}));

const Lease = (await import('../../src/models/lease.model.js')).default;
const { notify } = await import('../../src/services/notification.services.js');
const { checkExpiringLeases } = await import('../../src/services/LeaseReminder.service.js');

beforeEach(() => vi.clearAllMocks());

describe('checkExpiringLeases', () => {
  it('notifies the tenant of every lease returned and reports the count', async () => {
    const leases = [
      { tenantId: 10, endDate: '2026-09-01' },
      { tenantId: 11, endDate: '2026-09-05' },
    ];
    Lease.findAll.mockResolvedValue(leases);
    notify.mockResolvedValue({});

    const count = await checkExpiringLeases();

    expect(count).toBe(2);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenNthCalledWith(
      1,
      10,
      expect.stringContaining('Your lease ends on 2026-09-01')
    );
    expect(notify).toHaveBeenNthCalledWith(2, 11, expect.stringContaining('renewal'));
  });

  it('queries only ACTIVE leases inside a bounded date window', async () => {
    Lease.findAll.mockResolvedValue([]);

    await checkExpiringLeases();

    const where = Lease.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('active');
    // endDate between [today, today+30] as YYYY-MM-DD strings
    const bounds = Object.values(where.endDate).flat();
    for (const b of bounds) {
      expect(b).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(notify).not.toHaveBeenCalled();
  });

  it('returns 0 when nothing expires', async () => {
    Lease.findAll.mockResolvedValue([]);
    const count = await checkExpiringLeases();
    expect(count).toBe(0);
  });
});
