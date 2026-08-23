import cron from 'node-cron';
import { generateMonthlyRent } from '../services/rent.service.js';

export function startRentJob() {
  // runs at 00:05 on the 1st of every month
  cron.schedule('5 0 1 * *', async () => {
    console.log('Running monthly rent generation...');
    const count = await generateMonthlyRent();
    console.log(`Generated ${count} rent records`);
  });
}