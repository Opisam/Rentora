import { RentPayment, Lease, Unit, Property } from '../models/index.js';
import { generateMonthlyRent } from '../services/rent.service.js';
import { notify } from '../services/notification.services.js';

// For testing/demo purposes — landlord can manually trigger generation instead of waiting for the 1st of the month
export async function triggerRentGeneration(req, res) {
  const count = await generateMonthlyRent();
  res.json({ message: `Generated ${count} rent records` });
}

export async function getMyRentHistory(req, res) {
  const payments = await RentPayment.findAll({
    include: {
      model: Lease, as: 'lease', where: { tenantId: req.user.id },
      include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
    },
    order: [['dueDate', 'DESC']],
  });
  res.json(payments);
}

export async function getRentForLandlord(req, res) {
  const payments = await RentPayment.findAll({
    include: {
      model: Lease, as: 'lease', required: true,
      include: {
        model: Unit, as: 'unit', required: true,
        include: { model: Property, as: 'property', where: { landlordId: req.user.id }, required: true },
      },
    },
    order: [['dueDate', 'DESC']],
  });
  res.json(payments);
}

export async function markRentPaid(req, res) {
  const payment = await RentPayment.findByPk(req.params.id, {
    include: {
      model: Lease, as: 'lease',
      include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
    },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.lease.unit.property.landlordId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await payment.update({
    status: 'paid',
    amountPaid: payment.amountDue,
    paidDate: new Date().toISOString().slice(0, 10),
  });
  await notify(payment.lease.tenantId, `Your rent payment of $${payment.amountDue} was marked as paid`);
  res.json(payment);
}