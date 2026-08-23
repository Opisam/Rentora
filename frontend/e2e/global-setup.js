import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup() {
  if (process.env.SKIP_DB_SEED === '1') return;
  const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend');
  console.log('\n[e2e] Reseeding demo database for deterministic journeys...');
  execSync('node seed.mjs', { cwd: backendDir, stdio: 'inherit' });
}
