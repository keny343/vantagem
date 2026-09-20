import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 15_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://vantagem:vantagem@127.0.0.1:5432/vantagem_test',
      LOG_LEVEL: 'silent',
    },
  },
});
