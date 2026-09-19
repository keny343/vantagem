import type { Request, Response } from 'express';
import { z } from 'zod';
import * as repo from '../repositories/produtos.repository.js';
import { notFound } from '../utils/errors.js';

const filtrosSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoria: z.string().trim().max(80).optional(),
  marca: z.string().trim().max(80).optional(),
  max: z.coerce.number().min(0).max(100_000).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  const categorias = await repo.listarCategorias();
  res.json({
    categorias: categorias.map((c) => ({ slug: c.slug, name: c.nome, order: c.ordem })),
  });
};

export const getMarcas = async (_req: Request, res: Response): Promise<void> => {
  const marcas = await repo.listarMarcas();
  res.json({ brands: marcas });
};

export const getProdutos = async (req: Request, res: Response): Promise<void> => {
  const filtros = filtrosSchema.parse(req.query);
  const produtos = await repo.listarProdutos({
    ...(filtros.q !== undefined ? { q: filtros.q } : {}),
    ...(filtros.categoria !== undefined ? { categoria: filtros.categoria } : {}),
    ...(filtros.marca !== undefined ? { marca: filtros.marca } : {}),
    ...(filtros.max !== undefined ? { maxEuros: filtros.max } : {}),
    ...(filtros.featured !== undefined ? { featured: filtros.featured } : {}),
  });
  res.json({ products: produtos, count: produtos.length });
};

export const getProduto = async (req: Request, res: Response): Promise<void> => {
  const slug = z.string().trim().min(1).max(80).parse(req.params.slug);
  const produto = await repo.obterPorSlug(slug);
  if (produto === null) throw notFound('Produto');
  const related = await repo.relacionados(produto.slug, produto.category);
  res.json({ product: produto, related });
};

export const getHealth = (_req: Request, res: Response): void => {
  res.json({ ok: true, service: 'vantagem-api' });
};

export const getReady = async (_req: Request, res: Response): Promise<void> => {
  const { query } = await import('../config/database.js');
  await query('SELECT 1');
  res.json({ ok: true });
};
