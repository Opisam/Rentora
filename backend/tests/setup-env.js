import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// load test env BEFORE any app module is imported — dotenv.config() inside app
// modules does not override already-set vars, so these values win over .env
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '..', '.env.test'), override: true });
process.env.NODE_ENV = 'test';
