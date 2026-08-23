import { Op } from 'sequelize';
import { Lease, RentPayment } from '../models/index.js';

// YYYY-MM-DD from local date parts — never use toISOString() here, it shifts
// the calendar day for anyone ahead of UTC
function isoLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Generates this month's rent record for every active lease that doesn't already have one
export async function generateMonthlyRent() {
  const today = new Date();
  const dueDate = isoLocal(new Date(today.getFullYear(), today.getMonth(), 1)); // 1st of this month

  const activeLeases = await Lease.findAll({ where: { status: 'active' } });

  let created = 0;
  for (const lease of activeLeases) {
    const existing = await RentPayment.findOne({
      where: { leaseId: lease.id, dueDate },
    });
    if (existing) continue; // already generated for this month

    await RentPayment.create({
      leaseId: lease.id,
      amountDue: lease.monthlyRent,
      dueDate,
      status: 'pending',
    });
    created++;
  }

  // mark anything past due as late
  await RentPayment.update(
    { status: 'late' },
    { where: { status: 'pending', dueDate: { [Op.lt]: isoLocal(today) } } }
  );

  return created;
}
