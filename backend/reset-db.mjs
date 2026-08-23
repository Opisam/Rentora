import sequelize from './src/config/database.js';
import './src/models/index.js'; // register all models so sync() knows what to drop/create

async function reset() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ force: true });
    console.log('All tables dropped and recreated fresh');

    const tables = await sequelize.getQueryInterface().showAllTables();
    for (const table of tables.sort()) {
      const [rows] = await sequelize.query(`SELECT COUNT(*) AS count FROM "${table}"`);
      console.log(`  ${table}: ${rows[0].count} rows`);
    }

    await sequelize.close();
    console.log('Done — database is fresh.');
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

reset();
