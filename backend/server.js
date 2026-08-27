import app from './src/app.js';
import sequelize from './src/config/database.js';
import { startRentJob } from './src/jobs/rent.job.js';
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync();
    console.log('Models synced');
    app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${PORT}`));
    startRentJob();
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

start();