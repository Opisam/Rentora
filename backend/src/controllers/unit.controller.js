import { Unit, Property } from '../models/index.js';

async function assertOwnsProperty(propertyId, landlordId) {
  const property = await Property.findByPk(propertyId);
  if (!property) return { error: 'Property not found', status: 404 };
  if (property.landlordId !== landlordId) return { error: 'Forbidden', status: 403 };
  return { property };
}

export async function createUnit(req, res) {
  const { propertyId } = req.params;
  const check = await assertOwnsProperty(propertyId, req.user.id);
  if (check.error) return res.status(check.status).json({ error: check.error });

  const { unitNumber, bedrooms, bathrooms, rentAmount } = req.body;
  const unit = await Unit.create({ unitNumber, bedrooms, bathrooms, rentAmount, propertyId });
  res.status(201).json(unit);
}

export async function updateUnit(req, res) {
  const unit = await Unit.findByPk(req.params.id, { include: { model: Property, as: 'property' } });
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  if (unit.property.landlordId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await unit.update(req.body);
  res.json(unit);
}

export async function deleteUnit(req, res) {
  const unit = await Unit.findByPk(req.params.id, { include: { model: Property, as: 'property' } });
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  if (unit.property.landlordId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await unit.destroy();
  res.status(204).send();
}

// Public/tenant-facing: browse all vacant units
export async function getVacantUnits(req, res) {
  const units = await Unit.findAll({
    where: { status: 'vacant' },
    include: { model: Property, as: 'property', attributes: ['name', 'address', 'city'] },
  });
  res.json(units);
}