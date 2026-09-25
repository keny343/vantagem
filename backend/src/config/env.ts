import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4200),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  CORS_ORIGINS: z.string().default('http://localhost:5174'),
  SESSION_COOKIE_NAME: z.string().min(1).default('vantagem_session'),
  CSRF_SECRET: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  /** Webhook opcional para erros 5xx (Sentry ingest, Discord, etc.). */
  ERROR_WEBHOOK_URL: z.string().optional().default(''),
  FRONTEND_URL: z.string().default('http://localhost:5174'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().optional().default('artigos'),
  ADMIN_EMAIL: z.string().optional().default(''),
  ADMIN_PASSWORD: z.string().optional().default(''),
  PAGAMENTO_MODO: z.enum(['demo', 'producao']).default('producao'),
  PAGAMENTO_WEBHOOK_SECRET: z.string().optional().default(''),
  LOJA_NIF: z.string().optional().default(''),
  LOJA_IBAN: z.string().optional().default(''),
  LOJA_EMAIL: z.string().optional().default(''),
  LOJA_TELEFONE: z.string().optional().default(''),
  LOJA_MORADA: z.string().optional().default(''),
  LOJA_NOME_LEGAL: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detalhe = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration -> ${detalhe}`);
}

const raw = parsed.data;

if (raw.NODE_ENV === 'production' && (!raw.CSRF_SECRET || raw.CSRF_SECRET.length < 16)) {
  throw new Error(
    'Invalid environment configuration -> CSRF_SECRET: obrigatório em produção (mínimo 16 caracteres).',
  );
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0),
} as const;

export type Env = typeof env;
