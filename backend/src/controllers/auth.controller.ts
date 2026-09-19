import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { lerSessao } from '../middleware/authenticate.js';
import { emitirCsrf, COOKIE_CSRF } from '../middleware/csrf.js';
import * as authRepo from '../repositories/auth.repository.js';
import { COOKIE_SESSAO, iniciarSessao, terminarSessao } from '../services/auth.service.js';

const esquemaLogin = z.object({
  email: z.string().trim().min(3).max(200).email('Email inválido.'),
  password: z.string().min(1, 'A palavra-passe é obrigatória.').max(200),
});

/**
 * Cross-origin (Vercel → Render) needs SameSite=None + Secure, otherwise the
 * session cookie never leaves the API host. Local HTTP keeps Lax.
 */
const opcoesCookie = (expiresAt: Date): CookieOptions => ({
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  path: '/',
  expires: expiresAt,
});

const clienteIp = (req: Request): string | null => req.ip ?? null;

export const login = async (req: Request, res: Response): Promise<void> => {
  const dados = esquemaLogin.parse(req.body);
  const sessao = await iniciarSessao({
    email: dados.email,
    password: dados.password,
    ip: clienteIp(req),
    userAgent: req.header('user-agent') ?? null,
  });
  res.cookie(COOKIE_SESSAO, sessao.token, opcoesCookie(sessao.expiresAt));
  emitirCsrf(res);
  res.json({ user: sessao.user });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  await terminarSessao(cookies?.[COOKIE_SESSAO]);
  res.clearCookie(COOKIE_SESSAO, {
    path: '/',
    sameSite: env.isProduction ? 'none' : 'lax',
    secure: env.isProduction,
  });
  res.json({ ok: true });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const sessao = await lerSessao(req);
  if (sessao === null) {
    res.json({ user: null });
    return;
  }
  const perfil = await authRepo.obterUtilizador(sessao.userId);
  res.json({
    user: {
      id: sessao.userId,
      name: sessao.nome,
      email: sessao.email,
      role: sessao.perfil,
      phone: perfil?.telefone ?? null,
      address: perfil?.morada ?? null,
      postalCode: perfil?.codigo_postal ?? null,
      city: perfil?.cidade ?? null,
    },
  });
};

export const csrf = (req: Request, res: Response): void => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const actual = cookies?.[COOKIE_CSRF];
  const token =
    actual !== undefined && actual.length >= 20 ? actual : emitirCsrf(res);
  res.json({ csrfToken: token });
};
