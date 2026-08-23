import bcrypt from 'bcrypt';
import sequelize from './src/config/database.js';
import {
  User, Property, Unit, Application, Lease, RentPayment,
  MaintenanceRequest, Expense, Notification,
} from './src/models/index.js';

const PASSWORD = 'Demo1234!';

// helpers -------------------------------------------------------------
const pad = n => String(n).padStart(2, '0');
const dateOf = (yearOffset, monthOffsetFromJan, day = 1) =>
  `${new Date().getFullYear() + yearOffset}-${pad(monthOffsetFromJan)}-${pad(day)}`;

// 1st of the month, `back` months before this one (0 = current month)
const firstOfMonth = back => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - back);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};
const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysAhead = n => daysAgo(-n);

async function seed() {
  await sequelize.authenticate();
  console.log('Database connected');

  // wipe existing data so the seed is repeatable
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  console.log('Existing data cleared');

  const hash = await bcrypt.hash(PASSWORD, 12);

  // users --------------------------------------------------------------
  const [landlord, james, maria] = await Promise.all([
    User.create({ name: 'Sarah Mitchell', email: 'landlord@demo.com', password: hash, role: 'landlord' }),
    User.create({ name: 'James Chen', email: 'tenant@demo.com', password: hash, role: 'tenant' }),
    User.create({ name: 'Maria Lopez', email: 'maria@demo.com', password: hash, role: 'tenant' }),
  ]);

  // properties + units ---------------------------------------------------
  const maple = await Property.create({
    name: 'Maple Court', address: '42 Maple Avenue', city: 'Springfield',
    landlordId: landlord.id,
  });
  const lakeside = await Property.create({
    name: 'Lakeside Apartments', address: '8 Lakeview Drive', city: 'Riverton',
    landlordId: landlord.id,
  });

  const unit1A = await Unit.create({ unitNumber: '1A', bedrooms: 2, bathrooms: 1, rentAmount: 1200, status: 'occupied', propertyId: maple.id });
  const unit1B = await Unit.create({ unitNumber: '1B', bedrooms: 1, bathrooms: 1, rentAmount: 950, status: 'vacant', propertyId: maple.id });
  const unit2A = await Unit.create({ unitNumber: '2A', bedrooms: 3, bathrooms: 2, rentAmount: 1600, status: 'vacant', propertyId: maple.id });
  const unit101 = await Unit.create({ unitNumber: '101', bedrooms: 2, bathrooms: 2, rentAmount: 1350, status: 'occupied', propertyId: lakeside.id });
  const unit102 = await Unit.create({ unitNumber: '102', bedrooms: 2, bathrooms: 1, rentAmount: 1300, status: 'vacant', propertyId: lakeside.id });

  // applications ---------------------------------------------------------
  const appJames = await Application.create({
    status: 'approved',
    message: 'Hi! I work downtown and love the quiet neighborhood. Non-smoker, no pets, happy to provide references.',
    unitId: unit1A.id, tenantId: james.id,
  });
  const appMaria = await Application.create({
    status: 'approved',
    message: 'Looking for a long-term home for me and my daughter. Steady income, excellent rental history.',
    unitId: unit101.id, tenantId: maria.id,
  });
  const appRejected = await Application.create({
    status: 'rejected',
    message: 'Interested in this unit if it is still available next week.',
    unitId: unit101.id, tenantId: james.id,
  });
  const appPending = await Application.create({
    status: 'pending',
    message: 'We are expecting a baby in October and need an extra bedroom. Could we schedule a viewing this weekend?',
    unitId: unit2A.id, tenantId: maria.id,
  });

  // leases ----------------------------------------------------------------
  const leaseJames = await Lease.create({
    startDate: daysAgo(150), endDate: daysAhead(215), monthlyRent: 1200,
    status: 'active', unitId: unit1A.id, tenantId: james.id, applicationId: appJames.id,
  });
  const leaseMaria = await Lease.create({
    startDate: daysAgo(300), endDate: daysAhead(65), monthlyRent: 1350,
    status: 'active', unitId: unit101.id, tenantId: maria.id, applicationId: appMaria.id,
  });

  // rent history: past months paid, current month pending ------------------
  async function seedRentHistory(lease, monthsBack) {
    for (let i = monthsBack; i >= 1; i--) {
      const due = firstOfMonth(i);
      await RentPayment.create({
        leaseId: lease.id,
        amountDue: lease.monthlyRent,
        amountPaid: lease.monthlyRent,
        dueDate: due,
        paidDate: due, // paid right on time
        status: 'paid',
      });
    }
    await RentPayment.create({
      leaseId: lease.id,
      amountDue: lease.monthlyRent,
      amountPaid: 0,
      dueDate: firstOfMonth(0), // due on the 1st of this month
      status: new Date().getDate() > 5 ? 'late' : 'pending',
    });
  }
  await seedRentHistory(leaseJames, 4);
  await seedRentHistory(leaseMaria, 9);

  // maintenance requests ----------------------------------------------------
  await MaintenanceRequest.create({
    title: 'Leaking kitchen faucet',
    description: 'The cold water tap keeps dripping even when fully closed. Getting worse over the last week.',
    priority: 'medium', status: 'open',
    unitId: unit1A.id, tenantId: james.id,
  });
  await MaintenanceRequest.create({
    title: 'AC not cooling properly',
    description: 'Air conditioner runs constantly but the apartment stays warm, especially in the afternoon.',
    priority: 'high', status: 'in_progress',
    unitId: unit101.id, tenantId: maria.id,
  });
  await MaintenanceRequest.create({
    title: "Bedroom window won't lock",
    description: 'The latch on the bedroom window is stripped and the window will not secure. Ground floor unit.',
    priority: 'high', status: 'resolved',
    unitId: unit1A.id, tenantId: james.id,
  });

  // expenses ---------------------------------------------------------------
  await Expense.bulkCreate([
    { category: 'repairs', amount: 185.50, description: 'Plumber - replaced washers and kitchen cartridge', date: daysAgo(20), propertyId: maple.id },
    { category: 'insurance', amount: 940.00, description: 'Annual landlord insurance premium', date: daysAgo(60), propertyId: maple.id },
    { category: 'taxes', amount: 2250.00, description: 'Semi-annual property tax payment', date: daysAgo(90), propertyId: maple.id },
    { category: 'utilities', amount: 78.20, description: 'Water bill for common areas', date: daysAgo(12), propertyId: maple.id },
    { category: 'repairs', amount: 420.00, description: 'HVAC technician - AC compressor recharge', date: daysAgo(5), propertyId: lakeside.id },
    { category: 'management_fees', amount: 135.00, description: 'Monthly property management fee', date: firstOfMonth(0), propertyId: lakeside.id },
  ]);

  // notifications ------------------------------------------------------------
  await Notification.bulkCreate([
    { message: 'New application received for Unit 2A from Maria Lopez', userId: landlord.id, isRead: false },
    { message: 'New maintenance request: Leaking kitchen faucet (Unit 1A)', userId: landlord.id, isRead: false },
    { message: 'Your maintenance request "AC not cooling properly" is now in_progress', userId: maria.id, isRead: false },
    { message: `Your rent payment of $${leaseMaria.monthlyRent} was marked as paid`, userId: maria.id, isRead: true },
    { message: 'Your application for Maple Court was approved!', userId: james.id, isRead: true },
    { message: 'Your maintenance request "Bedroom window won\'t lock" is now resolved', userId: james.id, isRead: true },
  ]);

  // summary -----------------------------------------------------------------
  console.log('\nSeed complete!\n');
  console.log('Login credentials (password for ALL accounts): Demo1234!');
  console.log('  Landlord : landlord@demo.com   (Sarah Mitchell)');
  console.log('  Tenant   : tenant@demo.com     (James Chen)');
  console.log('  Tenant   : maria@demo.com      (Maria Lopez)\n');
  const counts = {};
  for (const [name, model] of Object.entries({
    Users: User, Properties: Property, Units: Unit, Applications: Application,
    Leases: Lease, RentPayments: RentPayment, MaintenanceRequests: MaintenanceRequest,
    Expenses: Expense, Notifications: Notification,
  })) {
    counts[name] = await model.count();
  }
  console.table(counts);

  await sequelize.close();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
