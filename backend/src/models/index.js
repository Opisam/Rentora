import User from './user.model.js';
import Property from './property.model.js';
import Unit from './unit.model.js';
import Application from './application.model.js';
import Lease from './lease.model.js';
import RentPayment from './rentPayment.js';
import MaintenanceRequest from './maintenanceRequest.model.js';
import Expense from './expense.model.js';
import Notification from './notification.model.js';
import Document from './document.model.js';

// A landlord (User) has many Properties
User.hasMany(Property, { foreignKey: 'landlordId', as: 'properties' });
Property.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });

// A Property has many Units
Property.hasMany(Unit, { foreignKey: 'propertyId', as: 'units', onDelete: 'CASCADE' });
Unit.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// A tenant (User) has many Applications
User.hasMany(Application, { foreignKey: 'tenantId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });

// A Unit has many Applications
Unit.hasMany(Application, { foreignKey: 'unitId', as: 'applications' });
Application.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// A Unit has many Leases (over time), but only one active at a time (enforced in code, not DB)
Unit.hasMany(Lease, { foreignKey: 'unitId', as: 'leases' });
Lease.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// A tenant (User) has many Leases
User.hasMany(Lease, { foreignKey: 'tenantId', as: 'leases' });
Lease.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });

// A Lease originates from one Application
Application.hasOne(Lease, { foreignKey: 'applicationId', as: 'lease' });
Lease.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

Lease.hasMany(RentPayment, { foreignKey: 'leaseId', as: 'rentPayments' });
RentPayment.belongsTo(Lease, { foreignKey: 'leaseId', as: 'lease' });

Unit.hasMany(MaintenanceRequest, { foreignKey: 'unitId', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

User.hasMany(MaintenanceRequest, { foreignKey: 'tenantId', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });

Property.hasMany(Expense, { foreignKey: 'propertyId', as: 'expenses', onDelete: 'CASCADE' });
Expense.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });


User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


Lease.hasMany(Document, { foreignKey: 'leaseId', as: 'documents' });
Document.belongsTo(Lease, { foreignKey: 'leaseId', as: 'lease' });

export { User, Property, Unit, Application, Lease, RentPayment, MaintenanceRequest, Expense, Notification, Document };