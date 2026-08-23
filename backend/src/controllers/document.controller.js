import { Document, Lease, Unit, Property } from '../models/index.js';

async function assertLeaseAccess(leaseId, userId, role) {
  const lease = await Lease.findByPk(leaseId, { include: { model: Unit, as: 'unit', include: { model: Property, as: 'property' } } });
  if (!lease) return { error: 'Lease not found', status: 404 };
  const isOwner = role === 'landlord' && lease.unit.property.landlordId === userId;
  const isTenant = role === 'tenant' && lease.tenantId === userId;
  if (!isOwner && !isTenant) return { error: 'Forbidden', status: 403 };
  return { lease };
}

export async function uploadDocument(req, res) {
  const { leaseId } = req.params;
  const check = await assertLeaseAccess(leaseId, req.user.id, req.user.role);
  if (check.error) return res.status(check.status).json({ error: check.error });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const doc = await Document.create({
    leaseId, filename: req.file.filename, originalName: req.file.originalname,
  });
  res.status(201).json(doc);
}

export async function getDocumentsForLease(req, res) {
  const { leaseId } = req.params;
  const check = await assertLeaseAccess(leaseId, req.user.id, req.user.role);
  if (check.error) return res.status(check.status).json({ error: check.error });

  const docs = await Document.findAll({ where: { leaseId } });
  res.json(docs);
}