import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { LOJA } from '../config/loja.js';
import { query } from '../config/database.js';
import * as pedidos from '../services/pedidos.service.js';
import { emailEstadoPedido } from '../services/email.service.js';
import { AppError } from '../utils/errors.js';

const webhookSchema = z.object({
  referencia: z.string().trim().min(3).max(40),
  estado: z.enum(['pago', 'falhou']),
  transacaoId: z.string().trim().max(80).optional(),
});

const autorizarWebhook = (req: Request): boolean => {
  const secret = env.PAGAMENTO_WEBHOOK_SECRET;
  if (!secret) return false;
  const auth = req.header('authorization') ?? '';
  const enviado = auth.startsWith('Bearer ') ? auth.slice(7) : req.header('x-webhook-secret') ?? '';
  return enviado.length > 0 && enviado === secret;
};

export const webhook = async (req: Request, res: Response): Promise<void> => {
  if (!autorizarWebhook(req)) {
    throw new AppError('UNAUTHENTICATED', 'Webhook não autorizado.');
  }
  const dados = webhookSchema.parse(req.body);
  await query(
    `INSERT INTO eventos_pagamento (referencia, origem, estado, payload)
     VALUES ($1, 'webhook', $2, $3::jsonb)`,
    [dados.referencia, dados.estado, JSON.stringify(req.body)],
  );
  if (dados.estado === 'pago') {
    const order = await pedidos.confirmarPagamento(dados.referencia);
    void emailEstadoPedido(
      order.customer.email,
      order.customer.name,
      order.reference,
      'Pago',
    );
  }
  res.json({ ok: true });
};

export const dadosPagamento = (_req: Request, res: Response): void => {
  res.json({
    modo: LOJA.pagamentoModo,
    iban: LOJA.iban || null,
    beneficiario: LOJA.nomeLegal,
    entidade: LOJA.mbEntidade,
  });
};
