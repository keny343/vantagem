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
      // Alinhado com docker-compose (host 5434) e backend/.env.example.
      // Em CI, DATABASE_URL do workflow prevalece.
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://vantagem:vantagem_dev@127.0.0.1:5434/vantagem',
      DATABASE_SSL: process.env.DATABASE_SSL ?? 'false',
      LOG_LEVEL: 'silent',
      CSRF_SECRET: process.env.CSRF_SECRET ?? 'vitest-csrf-secret',
    },
  },
});
