import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'npm run start:e2e',
          cwd: '../backend',
          url: 'http://127.0.0.1:4200/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            NODE_ENV: 'development',
            PORT: '4200',
            LOG_LEVEL: 'warn',
          },
        },
        {
          command: 'npm run dev -- --host 127.0.0.1 --port 5174',
          cwd: '../frontend',
          url: 'http://127.0.0.1:5174',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            VANTAGEM_API_TARGET: 'http://127.0.0.1:4200',
          },
        },
      ],
});
