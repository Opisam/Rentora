import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
    setupFiles: ['tests/setup-env.js'],
    fileParallelism: false, // integration suites share one Postgres DB — run files sequentially
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
