import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Property = sequelize.define('Property', {
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
});

export default Property;