import { Property, Unit } from '../models/index.js';

export async function createProperty(req, res) {
  try {
    const { name, address, city } = req.body;
    const property = await Property.create({
      name, address, city,
      landlordId: req.user.id, // taken from the JWT, never trust a client-supplied landlordId
    });
    res.status(201).json(property);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create property' });
  }
}

export async function getMyProperties(req, res) {
  const properties = await Property.findAll({
    where: { landlordId: req.user.id },
    include: { model: Unit, as: 'units' },
  });
  res.json(properties);
}

export async function getPropertyById(req, res) {
  const property = await Property.findByPk(req.params.id, {
    include: { model: Unit, as: 'units' },
  });
  if (!property) return res.status(404).json({ error: 'Property not found' });

  // ownership check: landlords can only view their own property in detail
  if (property.landlordId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(property);
}

export async function updateProperty(req, res) {
  const property = await Property.findByPk(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  if (property.landlordId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, address, city } = req.body;
  await property.update({ name, address, city });
  res.json(property);
}

export async function deleteProperty(req, res) {
  const property = await Property.findByPk(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  if (property.landlordId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await property.destroy();
  res.status(204).send();
}