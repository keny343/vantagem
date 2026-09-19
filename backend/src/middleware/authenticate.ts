import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { COOKIE_SESSAO, resolverSessao } from '../services/auth.service.js';
import type { Perfil } from '../types/domain.js';
import { AppError } from '../utils/errors.js';

export const lerSessao = async (req: Request) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return resolverSessao(cookies?.[COOKIE_SESSAO]);
};

export const requerAutenticacao: RequestHandler = (req, _res, next) => {
  void lerSessao(req)
    .then((sessao) => {
      if (sessao === null) {
        next(new AppError('UNAUTHENTICATED', 'Precisas de iniciar sessão.'));
        return;
      }
      req.auth = sessao;
      next();
    })
    .catch(next);
};

export const requerPapel =
  (...permitidos: readonly Perfil[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.auth === undefined) {
      next(new AppError('UNAUTHENTICATED', 'Precisas de iniciar sessão.'));
      return;
    }
    if (!permitidos.includes(req.auth.perfil)) {
      next(new AppError('FORBIDDEN', 'O teu perfil não permite esta ação.'));
      return;
    }
    next();
  };

/** Visitantes e clientes podem comprar; a conta de administrador só gere a loja. */
export const bloquearComprasDeAdmin: RequestHandler = (req, _res, next) => {
  void lerSessao(req)
    .then((sessao) => {
      if (sessao?.perfil === 'admin') {
        next(
          new AppError(
            'FORBIDDEN',
            'A conta de administrador não faz compras. Entra com uma conta de cliente para encomendar.',
          ),
        );
        return;
      }
      next();
    })
    .catch(next);
};
