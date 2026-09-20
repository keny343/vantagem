import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface ErroReportavel {
  requestId: string;
  method: string;
  path: string;
  code: string;
  status: number;
  message: string;
  stack?: string;
}

/**
 * Envio opcional de erros 5xx para um webhook (Sentry Relay, Discord, Zapier, etc.).
 * Sem ERROR_WEBHOOK_URL não faz nada — logs estruturados continuam no stderr.
 */
export const reportarErro = (evento: ErroReportavel): void => {
  const url = env.ERROR_WEBHOOK_URL?.trim();
  if (!url || url.length === 0) return;
  if (evento.status < 500) return;

  const corpo = {
    source: 'vantagem-api',
    environment: env.NODE_ENV,
    ...evento,
    time: new Date().toISOString(),
  };

  void fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'vantagem-api/error-webhook' },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(4_000),
  }).catch((erro: unknown) => {
    logger.warn('error webhook failed', {
      message: erro instanceof Error ? erro.message : String(erro),
    });
  });
};
