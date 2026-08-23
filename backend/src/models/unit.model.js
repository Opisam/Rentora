import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Unit = sequelize.define('Unit', {
  unitNumber: { type: DataTypes.STRING, allowNull: false },
  bedrooms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  bathrooms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  rentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('vacant', 'occupied'),
    allowNull: false,
    defaultValue: 'vacant',
  },
});

export default Unit;