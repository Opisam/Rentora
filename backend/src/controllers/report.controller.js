import { Property, Unit, Expense, RentPayment, Lease } from '../models/index.js';
import { Op } from 'sequelize';

export async function getPropertyProfitability(req, res) {
  const properties = await Property.findAll({
    where: { landlordId: req.user.id },
    include: [{ model: Unit, as: 'units' }],
  });

  const report = await Promise.all(properties.map(async (property) => {
    const unitIds = property.units.map(u => u.id);

    // total rent collected: sum of paid RentPayments across all leases on this property's units
    const rentPayments = await RentPayment.findAll({
      include: {
        model: Lease, as: 'lease', required: true,
        where: { unitId: { [Op.in]: unitIds } },
      },
      where: { status: 'paid' },
    });
    const totalRentCollected = rentPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

    // total expenses for this property
    const expenses = await Expense.findAll({ where: { propertyId: property.id } });
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // occupancy
    const occupiedCount = property.units.filter(u => u.status === 'occupied').length;
    const occupancyRate = property.units.length > 0
      ? ((occupiedCount / property.units.length) * 100).toFixed(1)
      : '0.0';

    return {
      propertyId: property.id,
      propertyName: property.name,
      totalUnits: property.units.length,
      occupiedUnits: occupiedCount,
      occupancyRate: `${occupancyRate}%`,
      totalRentCollected,
      totalExpenses,
      netProfit: totalRentCollected - totalExpenses,
    };
  }));

  res.json(report);
}

export async function getPortfolioSummary(req, res) {
  const properties = await Property.findAll({ where: { landlordId: req.user.id } });
  const propertyIds = properties.map(p => p.id);

  const units = await Unit.findAll({ where: { propertyId: { [Op.in]: propertyIds } } });
  const expenses = await Expense.findAll({ where: { propertyId: { [Op.in]: propertyIds } } });
  const unitIds = units.map(u => u.id);

  const rentPayments = await RentPayment.findAll({
    include: { model: Lease, as: 'lease', required: true, where: { unitId: { [Op.in]: unitIds } } },
    where: { status: 'paid' },
  });

  const totalRentCollected = rentPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const occupiedCount = units.filter(u => u.status === 'occupied').length;

  res.json({
    totalProperties: properties.length,
    totalUnits: units.length,
    occupiedUnits: occupiedCount,
    vacantUnits: units.length - occupiedCount,
    occupancyRate: units.length > 0 ? `${((occupiedCount / units.length) * 100).toFixed(1)}%` : '0.0%',
    totalRentCollected,
    totalExpenses,
    netProfit: totalRentCollected - totalExpenses,
  });
}