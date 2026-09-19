import type { Request, Response, NextFunction } from 'express';
import * as devolucoes from '../repositories/devolucoes.repository.js';
import * as avaliacoes from '../repositories/avaliacoes.repository.js';
import { AppError } from '../utils/errors.js';

// Devoluções
export const listarDevolucoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const lista = await devolucoes.listarDevolucoes(req.auth!.userId);
    res.json({ devolucoes: lista });
  } catch (erro) {
    next(erro);
  }
};

export const criarDevolucao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { pedido_id, produto_id, motivo, descricao, fotos } = req.body;
    const devolucao = await devolucoes.criarDevolucao(req.auth!.userId, pedido_id, {
      produto_id,
      motivo,
      descricao,
      fotos,
    });
    res.status(201).json({ devolucao });
  } catch (erro) {
    next(erro);
  }
};

// Avaliações
export const criarAvaliacao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { produto_id, pedido_id, estrelas_produto, estrelas_entrega, comentario, fotos } =
      req.body;

    const pode = await avaliacoes.verificarPodeAvaliar(req.auth!.userId, produto_id, pedido_id);
    if (!pode) {
      throw new AppError('FORBIDDEN', 'Não podes avaliar este produto');
    }

    const avaliacao = await avaliacoes.criarAvaliacao(
      req.auth!.userId,
      produto_id,
      pedido_id,
      {
        estrelas_produto,
        estrelas_entrega,
        comentario,
        fotos,
      },
    );
    res.status(201).json({ avaliacao });
  } catch (erro) {
    next(erro);
  }
};

export const listarAvaliacoesProduto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { produtoId } = req.params;
    if (!produtoId || Array.isArray(produtoId)) {
      throw new AppError('VALIDATION_ERROR', 'ID do produto em falta');
    }
    const lista = await avaliacoes.listarAvaliacoesProduto(produtoId);
    res.json({ avaliacoes: lista });
  } catch (erro) {
    next(erro);
  }
};
