import type { Request, Response, NextFunction } from 'express';
import * as suporte from '../repositories/suporte.repository.js';
import { AppError } from '../utils/errors.js';

// Tickets
export const criarTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { categoria, assunto, descricao, prioridade } = req.body;
    const ticket = await suporte.criarTicket(req.auth!.userId, {
      categoria,
      assunto,
      descricao,
      prioridade,
    });
    res.status(201).json({ ticket });
  } catch (erro) {
    next(erro);
  }
};

export const listarTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tickets = await suporte.listarTickets(req.auth!.userId);
    res.json({ tickets });
  } catch (erro) {
    next(erro);
  }
};

export const obterTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'ID do ticket em falta');
    }
    const ticket = await suporte.obterTicket(id, req.auth!.userId);
    if (!ticket) {
      throw new AppError('NOT_FOUND', 'Ticket não encontrado');
    }
    const respostas = await suporte.listarRespostasTicket(id);
    res.json({ ticket, respostas });
  } catch (erro) {
    next(erro);
  }
};

export const responderTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'ID do ticket em falta');
    }
    const { mensagem } = req.body;
    const resposta = await suporte.responderTicket(id, req.auth!.userId, mensagem);
    res.status(201).json({ resposta });
  } catch (erro) {
    next(erro);
  }
};

// FAQ
export const listarFAQ = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const faq = await suporte.listarFAQ();
    res.json({ faq });
  } catch (erro) {
    next(erro);
  }
};
