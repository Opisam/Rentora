import { MaintenanceRequest, Unit, Property, Lease, User } from '../models/index.js';
import { notify } from '../services/notification.services.js';

// Tenant submits a request — but only for a unit they actually have an active lease on
export async function createRequest(req, res) {
  const { unitId, title, description, priority } = req.body;

  const activeLease = await Lease.findOne({
    where: { unitId, tenantId: req.user.id, status: 'active' },
  });
  if (!activeLease) {
    return res.status(403).json({ error: 'You do not have an active lease on this unit' });
  }

  const request = await MaintenanceRequest.create({
    unitId, tenantId: req.user.id, title, description, priority,
  });
  res.status(201).json(request);
}

export async function getMyRequests(req, res) {
  const requests = await MaintenanceRequest.findAll({
    where: { tenantId: req.user.id },
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
    order: [['createdAt', 'DESC']],
  });
  res.json(requests);
}

export async function getRequestsForLandlord(req, res) {
  const requests = await MaintenanceRequest.findAll({
    include: [
      {
        model: Unit, as: 'unit', required: true,
        include: { model: Property, as: 'property', where: { landlordId: req.user.id }, required: true },
      },
      { model: User, as: 'tenant', attributes: ['id', 'name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json(requests);
}

export async function updateRequestStatus(req, res) {
  const { status } = req.body;
  if (!['open', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const request = await MaintenanceRequest.findByPk(req.params.id, {
    include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } },
  });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.unit.property.landlordId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await request.update({ status });
  await notify(request.tenantId, `Your maintenance request "${request.title}" is now ${status}`);
  res.json(request);
}