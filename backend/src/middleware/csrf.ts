import { randomBytes } from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { tokensIguais } from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';

export const COOKIE_CSRF = 'vantagem_csrf';
export const HEADER_CSRF = 'x-csrf-token';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

const opcoesCsrf = (): CookieOptions => ({
  // Readable by the SPA so it can mirror the value into X-CSRF-Token.
  httpOnly: false,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const emitirCsrf = (res: Response, token = randomBytes(32).toString('base64url')): string => {
  res.cookie(COOKIE_CSRF, token, opcoesCsrf());
  return token;
};

/** Ensures every anonymous page load gets a CSRF cookie to use on the next mutation. */
export const garantirCsrf = (req: Request, res: Response, next: NextFunction): void => {
  const cookies = ((req as Request & { cookies?: Record<string, string> }).cookies ??= {});
  const actual = cookies[COOKIE_CSRF];
  if (actual === undefined || actual.length < 20) {
    cookies[COOKIE_CSRF] = emitirCsrf(res);
  }
  next();
};

/**
 * Double-submit cookie: the browser sends the cookie automatically and the SPA
 * must also put the same value in X-CSRF-Token. A cross-site form cannot read
 * the cookie, so it cannot forge the header.
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

  if (
    cookieToken === undefined ||
    headerToken === undefined ||
    cookieToken.length < 20 ||
    !tokensIguais(cookieToken, headerToken)
  ) {
    next(new AppError('FORBIDDEN', 'Token CSRF inválido ou em falta.'));
    return;
  }

  next();
};
