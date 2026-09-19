import type { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { eurosDeCentimos, type EstadoPedido } from '../types/domain.js';
import { notFound } from '../utils/errors.js';
import * as produtosRepo from '../repositories/produtos.repository.js';

export const resumo = async (_req: Request, res: Response): Promise<void> => {
  const [{ rows: produtos }, { rows: pedidos }, { rows: receita }, { rows: stockBaixo }] =
    await Promise.all([
      query<{ count: string }>(`SELECT count(*)::text AS count FROM produtos WHERE activo`),
      query<{ count: string }>(`SELECT count(*)::text AS count FROM pedidos`),
      query<{ total: string | null }>(
        `SELECT coalesce(sum(total_centimos),0)::text AS total FROM pedidos WHERE estado <> 'cancelado'`,
      ),
      query<{ count: string }>(
        `SELECT count(*)::text AS count FROM stock WHERE quantidade > 0 AND quantidade <= 5`,
      ),
    ]);

  res.json({
    products: Number(produtos[0]?.count ?? 0),
    orders: Number(pedidos[0]?.count ?? 0),
    revenue: eurosDeCentimos(Number(receita[0]?.total ?? 0)),
    lowStock: Number(stockBaixo[0]?.count ?? 0),
  });
};

export const listarProdutos = async (_req: Request, res: Response): Promise<void> => {
  const products = await produtosRepo.listarProdutos({});
  res.json({ products });
};

export const listarPedidos = async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await query<{
    id: string;
    referencia: string;
    estado: EstadoPedido;
    cliente_nome: string;
    cliente_email: string;
    total_centimos: number;
    created_at: Date;
  }>(
    `SELECT id, referencia, estado, cliente_nome, cliente_email, total_centimos, created_at
     FROM pedidos
     ORDER BY created_at DESC
     LIMIT 100`,
  );
  res.json({
    orders: rows.map((r) => ({
      id: r.id,
      reference: r.referencia,
      status: r.estado,
      customerName: r.cliente_nome,
      customerEmail: r.cliente_email,
      total: eurosDeCentimos(r.total_centimos),
      createdAt: r.created_at.toISOString(),
    })),
  });
};

const estadoSchema = z.object({
  status: z.enum(['pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado']),
});

export const actualizarEstado = async (req: Request, res: Response): Promise<void> => {
  const id = z.string().uuid().parse(req.params.id);
  const { status } = estadoSchema.parse(req.body);
  const { rowCount } = await query(
    `UPDATE pedidos SET estado = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
  if (rowCount === 0) throw notFound('Pedido');
  res.json({ ok: true, status });
};

const stockSchema = z.object({
  quantity: z.number().int().min(0).max(100_000),
});

export const actualizarStock = async (req: Request, res: Response): Promise<void> => {
  const slug = z.string().trim().min(1).max(80).parse(req.params.slug);
  const { quantity } = stockSchema.parse(req.body);
  const { rowCount } = await query(
    `UPDATE stock s
     SET quantidade = $1, actualizado_em = now()
     FROM produtos p
     WHERE s.produto_id = p.id AND p.slug = $2`,
    [quantity, slug],
  );
  if (rowCount === 0) throw notFound('Produto');
  res.json({ ok: true, quantity });
};
