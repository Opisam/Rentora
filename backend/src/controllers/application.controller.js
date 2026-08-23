import { Application, Unit, Property, User, Lease } from '../models/index.js';
import { notify } from '../services/notification.services.js';

// Tenant applies to a unit
export async function applyToUnit(req, res) {
  const { unitId } = req.params;
  const message = req.body?.message ?? null;

  const unit = await Unit.findByPk(unitId, {
    include: { model: Property, as: 'property' },
  });
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  if (unit.status !== 'vacant') return res.status(400).json({ error: 'Unit is not available' });

  // prevent duplicate pending applications from the same tenant to the same unit
  const existing = await Application.findOne({
    where: { unitId, tenantId: req.user.id, status: 'pending' },
  });
  if (existing) return res.status(409).json({ error: 'You already have a pending application for this unit' });

  const application = await Application.create({ unitId, tenantId: req.user.id, message });
  await notify(unit.property.landlordId, `New application received for Unit ${unit.unitNumber}`);
  res.status(201).json(application);
}

// Tenant views their own applications
export async function getMyApplications(req, res) {
  const applications = await Application.findAll({
    where: { tenantId: req.user.id },
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
  });
  res.json(applications);
}

// Landlord views applications for all their properties
export async function getApplicationsForLandlord(req, res) {
  const applications = await Application.findAll({
    include: [
      {
        model: Unit,
        as: 'unit',
        required: true,
        include: {
          model: Property,
          as: 'property',
          where: { landlordId: req.user.id }, // filters to only this landlord's properties
          required: true,
        },
      },
      { model: User, as: 'tenant', attributes: ['id', 'name', 'email'] },
      { model: Lease, as: 'lease' },
    ],
  });
  res.json(applications);
}

// Landlord approves or rejects
export async function updateApplicationStatus(req, res) {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  const application = await Application.findByPk(req.params.id, {
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
  });
  if (!application) return res.status(404).json({ error: 'Application not found' });

  // ownership check: this application must belong to one of this landlord's properties
  if (application.unit.property.landlordId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await application.update({ status });
  await notify(application.tenantId, `Your application for Unit ${application.unit.unitNumber} was ${status}`);
  res.json(application);
}
