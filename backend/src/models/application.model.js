import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Application = sequelize.define('Application', {
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  message: { type: DataTypes.TEXT, allowNull: true }, // optional note from tenant
});

export default Application;