import { Op } from 'sequelize';
import Lease from '../models/lease.model.js';
import { notify } from './notification.services.js';

export async function checkExpiringLeases() {
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const expiringLeases = await Lease.findAll({
    where: {
      status: 'active',
      endDate: { [Op.between]: [today.toISOString().slice(0, 10), in30Days.toISOString().slice(0, 10)] },
    },
  });

  for (const lease of expiringLeases) {
    await notify(lease.tenantId, `Your lease ends on ${lease.endDate} — renewal may be needed soon`);
  }
  return expiringLeases.length;
}
