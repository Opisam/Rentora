import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved'),
    allowNull: false,
    defaultValue: 'open',
  },
});

export default MaintenanceRequest;