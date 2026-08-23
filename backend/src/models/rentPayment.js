import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RentPayment = sequelize.define('RentPayment', {
  amountDue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  amountPaid: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  paidDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'late'),
    allowNull: false,
    defaultValue: 'pending',
  },
});

export default RentPayment;