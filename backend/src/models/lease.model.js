import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Lease = sequelize.define('Lease', {
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  monthlyRent: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'terminated'),
    allowNull: false,
    defaultValue: 'active',
  },
});

export default Lease;