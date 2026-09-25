import { createHmac, randomBytes } from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { tokensIguais } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';

export const COOKIE_CSRF = 'vantagem_csrf';
export const HEADER_CSRF = 'x-csrf-token';

/** Mensagem clara para quem não programa (heurística de Nielsen). */
export const MSG_CSRF =
  'Não foi possível concluir por uma questão de segurança. Actualiza a página e tenta outra vez.';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

const segredoCsrf = (): string => {
  if (env.CSRF_SECRET.length > 0) return env.CSRF_SECRET;
  if (env.isProduction) {
    throw new AppError('INTERNAL_ERROR', 'CSRF_SECRET em falta.');
  }
  return env.DATABASE_URL || 'vantagem-csrf-dev';
};

/** Token assinado: o SPA pode enviar só o cabeçalho (útil atrás do proxy Vercel). */
export const criarTokenCsrf = (): string => {
  const nonce = randomBytes(24).toString('base64url');
  const sig = createHmac('sha256', segredoCsrf()).update(nonce).digest('base64url');
  return `${nonce}.${sig}`;
};

export const tokenCsrfAssinado = (token: string): boolean => {
  const i = token.lastIndexOf('.');
  if (i <= 0) return false;
  const nonce = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (nonce.length < 16 || sig.length < 20) return false;
  const esperado = createHmac('sha256', segredoCsrf()).update(nonce).digest('base64url');
  return tokensIguais(sig, esperado);
};

const opcoesCsrf = (): CookieOptions => ({
  // Readable by the SPA so it can mirror the value into X-CSRF-Token.
  httpOnly: false,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const emitirCsrf = (res: Response, token = criarTokenCsrf()): string => {
  res.cookie(COOKIE_CSRF, token, opcoesCsrf());
  return token;
};

/** Ensures every anonymous page load gets a CSRF cookie to use on the next mutation. */
export const garantirCsrf = (req: Request, res: Response, next: NextFunction): void => {
  const cookies = ((req as Request & { cookies?: Record<string, string> }).cookies ??= {});
  const actual = cookies[COOKIE_CSRF];
  // Em mutações não rodamos o cookie: senão o proxy emite um valor novo
  // e o cabeçalho X-CSRF-Token (do SPA) deixa de coincidir.
  if (SAFE.has(req.method.toUpperCase())) {
    if (actual === undefined || actual.length < 20) {
      cookies[COOKIE_CSRF] = emitirCsrf(res);
    }
  }
  next();
};

/**
 * Aceita:
 * 1) cabeçalho com token HMAC válido (SPA atrás de rewrite Vercel→Render);
 * 2) double-submit clássico cookie === cabeçalho (legado / mesmo host).
 */
export const requerCsrf = (req: Request, _res: Response, next: NextFunction): void => {
  if (SAFE.has(req.method.toUpperCase())) {
    next();
    return;
  }
  if (req.originalUrl.startsWith('/api/pagamentos/webhook')) {
    next();
    return;
  }

  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const cookieToken = cookies?.[COOKIE_CSRF];
  const headerToken = req.header(HEADER_CSRF);

  if (headerToken !== undefined && headerToken.length >= 20 && tokenCsrfAssinado(headerToken)) {
    next();
    return;
  }

  if (
    cookieToken !== undefined &&
    headerToken !== undefined &&
    cookieToken.length >= 20 &&
    tokensIguais(cookieToken, headerToken)
  ) {
    next();
    return;
  }

  next(new AppError('FORBIDDEN', MSG_CSRF));
};
