import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as suporte from '../repositories/suporte.repository.js';
import * as engagement from '../repositories/engagement.repository.js';
import { query } from '../config/database.js';
import { AppError } from '../utils/errors.js';

const categorias = [
  'pedido',
  'pagamento',
  'entrega',
  'devolucao',
  'produto',
  'conta',
  'outro',
] as const;

const criarSchema = z.object({
  categoria: z.enum(categorias, { errorMap: () => ({ message: 'Escolhe o tipo de assunto.' }) }),
  assunto: z.string().trim().min(4, 'O título é demasiado curto.').max(120),
  descricao: z.string().trim().min(8, 'Explica o que se passa.').max(4000),
  pedidoReferencia: z.string().trim().min(3).max(40).optional(),
});

const mensagemSchema = z.object({
  mensagem: z.string().trim().min(1, 'Escreve uma mensagem.').max(4000),
});

const mapearMensagem = (r: suporte.RespostaTicket) => ({
  id: r.id,
  texto: r.mensagem,
  createdAt: r.created_at,
  autorNome: r.autor_nome,
  papel: r.autor_papel,
});

const mapearTicketCliente = (t: suporte.Ticket) => ({
  id: t.id,
  categoria: t.categoria,
  assunto: t.assunto,
  descricao: t.descricao,
  estado: t.estado,
  pedidoReferencia: t.pedido_referencia,
  created_at: t.created_at,
  updated_at: t.updated_at,
});

export const criarTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dados = criarSchema.parse(req.body);
    const userId = req.auth!.userId;

    if (dados.pedidoReferencia) {
      const existente = await suporte.encontrarAbertoPorPedido(userId, dados.pedidoReferencia);
      if (existente) {
        res.json({ ticket: mapearTicketCliente(existente), existente: true });
        return;
      }
      const { rows } = await query<{ id: string }>(
        `SELECT id FROM pedidos
         WHERE referencia = $1
           AND (utilizador_id = $2 OR lower(cliente_email) = lower($3))
         LIMIT 1`,
        [dados.pedidoReferencia, userId, req.auth!.email],
      );
      if (rows[0] === undefined) {
        throw new AppError('VALIDATION_ERROR', 'Essa encomenda não está ligada a esta conta.');
      }
    }

    const ticket = await suporte.criarTicket(userId, {
      categoria: dados.categoria,
      assunto: dados.assunto,
      descricao: dados.descricao,
      ...(dados.pedidoReferencia !== undefined
        ? { pedidoReferencia: dados.pedidoReferencia }
        : {}),
    });
    res.status(201).json({ ticket: mapearTicketCliente(ticket), existente: false });
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
    res.json({ tickets: tickets.map(mapearTicketCliente) });
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
      throw new AppError('VALIDATION_ERROR', 'Conversa em falta.');
    }
    const ticket = await suporte.obterTicket(id, req.auth!.userId);
    if (!ticket) {
      throw new AppError('NOT_FOUND', 'Conversa não encontrada.');
    }
    const respostas = await suporte.listarRespostasTicket(id);
    res.json({ ticket: mapearTicketCliente(ticket), mensagens: respostas.map(mapearMensagem) });
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
      throw new AppError('VALIDATION_ERROR', 'Conversa em falta.');
    }
    const { mensagem } = mensagemSchema.parse(req.body);
    const ticket = await suporte.obterTicket(id, req.auth!.userId);
    if (!ticket) {
      throw new AppError('NOT_FOUND', 'Conversa não encontrada.');
    }
    if (ticket.estado === 'fechado') {
      throw new AppError('VALIDATION_ERROR', 'Esta conversa está fechada.');
    }
    const resposta = await suporte.responderTicket(id, req.auth!.userId, mensagem);
    if (ticket.estado === 'resolvido') {
      await suporte.actualizarEstadoTicket(id, 'aberto');
    } else {
      await suporte.tocarTicket(id);
    }
    res.status(201).json({ mensagem: mapearMensagem(resposta) });
  } catch (erro) {
    next(erro);
  }
};

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

export const obterTicketAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'Conversa em falta.');
    }
    const ticket = await suporte.obterTicketAdmin(id);
    if (!ticket) {
      throw new AppError('NOT_FOUND', 'Conversa não encontrada.');
    }
    const respostas = await suporte.listarRespostasTicket(id);
    res.json({
      ticket: {
        id: ticket.id,
        category: ticket.categoria,
        subject: ticket.assunto,
        description: ticket.descricao,
        status: ticket.estado,
        pedidoReferencia: ticket.pedido_referencia,
        createdAt: ticket.created_at,
        customerName: ticket.cliente_nome,
        customerEmail: ticket.cliente_email,
        customerId: ticket.utilizador_id,
      },
      mensagens: respostas.map(mapearMensagem),
    });
  } catch (erro) {
    next(erro);
  }
};

export const responderTicketAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'Conversa em falta.');
    }
    const { mensagem } = mensagemSchema.parse(req.body);
    const ticket = await suporte.obterTicketAdmin(id);
    if (!ticket) {
      throw new AppError('NOT_FOUND', 'Conversa não encontrada.');
    }
    const resposta = await suporte.responderTicket(id, req.auth!.userId, mensagem);
    await suporte.actualizarEstadoTicket(
      id,
      ticket.estado === 'fechado' || ticket.estado === 'resolvido' ? 'em_analise' : 'em_analise',
    );
    void engagement.criarNotificacao(
      ticket.utilizador_id,
      'mensagem',
      'A loja respondeu',
      ticket.assunto,
      `/conta/suporte/${ticket.id}`,
    );
    res.status(201).json({ mensagem: mapearMensagem(resposta) });
  } catch (erro) {
    next(erro);
  }
};
