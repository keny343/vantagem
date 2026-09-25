import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174';

const dbUrl =
  process.env.DATABASE_URL ??
  'postgresql://vantagem:vantagem_dev@127.0.0.1:5434/vantagem';

const backendEnv = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: '4200',
  LOG_LEVEL: 'warn',
  DATABASE_URL: dbUrl,
  DATABASE_SSL: 'false',
  CORS_ORIGINS: 'http://127.0.0.1:5174,http://localhost:5174',
  FRONTEND_URL: 'http://127.0.0.1:5174',
  CSRF_SECRET: process.env.CSRF_SECRET ?? 'e2e-csrf-secret-hardening',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'admin@e2e.vantagem.test',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'E2eAdminPass99',
  LOJA_IBAN: process.env.LOJA_IBAN ?? 'AO06004400001234567890123',
  SESSION_COOKIE_NAME: 'vantagem_session',
};

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
          reuseExistingServer: false,
          timeout: 120_000,
          env: backendEnv,
        },
        {
          command: 'npm run dev -- --host 127.0.0.1 --port 5174',
          cwd: '../frontend',
          url: 'http://127.0.0.1:5174',
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...process.env,
            VANTAGEM_API_TARGET: 'http://127.0.0.1:4200',
            // Forçar proxy same-origin — evita CORS no browser.
            VITE_API_BASE: '',
          },
        },
      ],
});
