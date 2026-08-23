import sequelize from '../../src/config/database.js';
import '../../src/models/index.js';

// drops + recreates all tables for a clean slate per suite
export async function resetDb() {
  await sequelize.sync({ force: true });
}

export async function closeDb() {
  await sequelize.close();
}
