import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  message: { type: DataTypes.STRING, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

export default Notification;