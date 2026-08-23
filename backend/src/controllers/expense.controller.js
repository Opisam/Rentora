import { Expense, Property } from '../models/index.js';

async function assertOwnsProperty(propertyId, landlordId) {
  const property = await Property.findByPk(propertyId);
  if (!property) return { error: 'Property not found', status: 404 };
  if (property.landlordId !== landlordId) return { error: 'Forbidden', status: 403 };
  return { property };
}

export async function createExpense(req, res) {
  const { propertyId } = req.params;
  const check = await assertOwnsProperty(propertyId, req.user.id);
  if (check.error) return res.status(check.status).json({ error: check.error });

  const { category, amount, description, date } = req.body;
  const expense = await Expense.create({ propertyId, category, amount, description, date });
  res.status(201).json(expense);
}

export async function getExpensesForProperty(req, res) {
  const { propertyId } = req.params;
  const check = await assertOwnsProperty(propertyId, req.user.id);
  if (check.error) return res.status(check.status).json({ error: check.error });

  const expenses = await Expense.findAll({ where: { propertyId }, order: [['date', 'DESC']] });
  res.json(expenses);
}

export async function deleteExpense(req, res) {
  const expense = await Expense.findByPk(req.params.id, { include: { model: Property, as: 'property' } });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (expense.property.landlordId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  await expense.destroy();
  res.status(204).send();
}