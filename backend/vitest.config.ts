import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgres://vantagem:vantagem@127.0.0.1:5432/vantagem_test',
      DATABASE_SSL: process.env.DATABASE_SSL ?? 'false',
      LOG_LEVEL: 'silent',
      CSRF_SECRET: process.env.CSRF_SECRET ?? 'vitest-csrf-secret',
    },
  },
});
