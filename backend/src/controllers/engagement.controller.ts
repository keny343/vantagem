import type { Request, Response, NextFunction } from 'express';
import * as engagement from '../repositories/engagement.repository.js';
import { AppError } from '../utils/errors.js';

// Cupons
export const listarCupons = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const cupons = await engagement.listarCuponsUtilizador(req.auth!.userId);
    res.json({ cupons });
  } catch (erro) {
    next(erro);
  }
};

export const validarCupao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { codigo } = req.body;
    const cupao = await engagement.validarCupao(codigo);
    if (!cupao) {
      throw new AppError('NOT_FOUND', 'Cupão inválido ou expirado');
    }
    res.json({ cupao });
  } catch (erro) {
    next(erro);
  }
};

// Notificações
export const listarNotificacoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const notificacoes = await engagement.listarNotificacoes(req.auth!.userId);
    res.json({ notificacoes });
  } catch (erro) {
    next(erro);
  }
};

export const marcarNotificacaoLida = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'ID da notificação em falta');
    }
    await engagement.marcarComoLida(id, req.auth!.userId);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};

export const marcarTodasLidas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await engagement.marcarTodasLidas(req.auth!.userId);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};
