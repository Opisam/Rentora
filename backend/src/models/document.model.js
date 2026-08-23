import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Document = sequelize.define('Document', {
  filename: { type: DataTypes.STRING, allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
});

export default Document;