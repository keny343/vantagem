import type { Request, Response } from 'express';
import { z } from 'zod';
import { lerSessao } from '../middleware/authenticate.js';
import * as pedidos from '../services/pedidos.service.js';

const itemSchema = z.object({
  productId: z.string().trim().min(1).max(80),
  variant: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1).max(40),
  customer: z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional(),
    address: z.string().trim().min(3).max(300),
    postalCode: z.string().trim().min(4).max(20),
    city: z.string().trim().min(2).max(100),
  }),
  paymentMethod: z.enum(['cartao', 'mbway', 'multibanco']),
});

export const criarPedido = async (req: Request, res: Response): Promise<void> => {
  const dados = checkoutSchema.parse(req.body);
  const sessao = await lerSessao(req);
  const pedido = await pedidos.criarPedido({
    items: dados.items,
    customer: {
      name: dados.customer.name,
      email: dados.customer.email.toLowerCase(),
      ...(dados.customer.phone !== undefined ? { phone: dados.customer.phone } : {}),
      address: dados.customer.address,
      postalCode: dados.customer.postalCode,
      city: dados.customer.city,
    },
    paymentMethod: dados.paymentMethod,
    userId: sessao?.userId ?? null,
  });
  res.status(201).json({ order: pedido });
};

export const meusPedidos = async (req: Request, res: Response): Promise<void> => {
  if (req.auth === undefined) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Precisas de iniciar sessão.' } });
    return;
  }
  const lista = await pedidos.pedidosDoUtilizador(req.auth.userId);
  res.json({ orders: lista });
};

export const obterPedido = async (req: Request, res: Response): Promise<void> => {
  const referencia = z.string().trim().min(3).max(40).parse(req.params.referencia);
  const sessao = await lerSessao(req);
  const pedido = await pedidos.obterPorReferencia(referencia, sessao);
  res.json({ order: pedido });
};
