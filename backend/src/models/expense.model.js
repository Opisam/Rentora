import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Expense = sequelize.define('Expense', {
  category: {
    type: DataTypes.ENUM('repairs', 'insurance', 'taxes', 'utilities', 'management_fees', 'other'),
    allowNull: false,
  },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
});

export default Expense;