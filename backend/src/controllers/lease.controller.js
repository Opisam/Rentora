import { Lease, Application, Unit, Property } from '../models/index.js';
import sequelize from '../config/database.js';

// Landlord creates a lease from an approved application
export async function createLease(req, res) {
  const { applicationId, startDate, endDate, monthlyRent } = req.body;

  const application = await Application.findByPk(applicationId, {
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
  });
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (application.unit.property.landlordId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (application.status !== 'approved') {
    return res.status(400).json({ error: 'Application must be approved before creating a lease' });
  }

  const t = await sequelize.transaction();
  try {
    const lease = await Lease.create({
      unitId: application.unitId,
      tenantId: application.tenantId,
      applicationId: application.id,
      startDate,
      endDate,
      monthlyRent,
    }, { transaction: t });

    await Unit.update(
      { status: 'occupied' },
      { where: { id: application.unitId }, transaction: t }
    );

    await t.commit();
    res.status(201).json(lease);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Failed to create lease' });
  }
}

export async function getMyLeases(req, res) {
  const leases = await Lease.findAll({
    where: { tenantId: req.user.id },
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
  });
  res.json(leases);
}

export async function getLeasesForLandlord(req, res) {
  const leases = await Lease.findAll({
    include: [
      {
        model: Unit, as: 'unit', required: true,
        include: { model: Property, as: 'property', where: { landlordId: req.user.id }, required: true },
      },
    ],
  });
  res.json(leases);
}

export async function terminateLease(req, res) {
  const lease = await Lease.findByPk(req.params.id, {
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
  });
  if (!lease) return res.status(404).json({ error: 'Lease not found' });
  if (lease.unit.property.landlordId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const t = await sequelize.transaction();
  try {
    await lease.update({ status: 'terminated' }, { transaction: t });
    await Unit.update({ status: 'vacant' }, { where: { id: lease.unitId }, transaction: t });
    await t.commit();
    res.json(lease);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Failed to terminate lease' });
  }
}