import type { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { eurosDeCentimos, type EstadoPedido } from '../types/domain.js';
import { AppError, notFound } from '../utils/errors.js';
import * as catalogo from '../services/adminCatalog.service.js';
import * as pedidos from '../services/pedidos.service.js';
import { emailEstadoPedido } from '../services/email.service.js';

const ROTULO_ESTADO: Record<string, string> = {
  pendente: 'Aguardar pagamento',
  pago: 'Pago',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const resumo = async (_req: Request, res: Response): Promise<void> => {
  const [
    { rows: produtos },
    { rows: pedidos },
    { rows: receita },
    { rows: stockBaixo },
    { rows: pendentes },
    { rows: clientes },
    { rows: ticketsAbertos },
  ] = await Promise.all([
    query<{ count: string }>(`SELECT count(*)::text AS count FROM produtos WHERE activo`),
    query<{ count: string }>(`SELECT count(*)::text AS count FROM pedidos`),
    query<{ total: string | null }>(
      `SELECT coalesce(sum(total_centimos),0)::text AS total
       FROM pedidos WHERE estado NOT IN ('cancelado', 'pendente')`,
    ),
    query<{ count: string }>(
      `SELECT count(*)::text AS count FROM stock WHERE quantidade <= 5`,
    ),
    query<{ count: string }>(
      `SELECT count(*)::text AS count FROM pedidos WHERE estado IN ('pendente', 'pago', 'em_preparacao')`,
    ),
    query<{ count: string }>(
      `SELECT count(*)::text AS count FROM utilizadores WHERE perfil = 'cliente' AND activo`,
    ),
    query<{ count: string }>(
      `SELECT count(*)::text AS count FROM tickets WHERE estado IN ('aberto', 'em_analise')`,
    ),
  ]);

  const { rows: artigosBaixos } = await query<{
    nome: string;
    slug: string;
    quantidade: number;
  }>(
    `SELECT p.nome, p.slug, s.quantidade
     FROM stock s
     INNER JOIN produtos p ON p.id = s.produto_id
     WHERE s.quantidade <= 5
     ORDER BY s.quantidade ASC, p.nome ASC
     LIMIT 12`,
  );

  res.json({
    products: Number(produtos[0]?.count ?? 0),
    orders: Number(pedidos[0]?.count ?? 0),
    revenue: eurosDeCentimos(Number(receita[0]?.total ?? 0)),
    lowStock: Number(stockBaixo[0]?.count ?? 0),
    pendingOrders: Number(pendentes[0]?.count ?? 0),
    customers: Number(clientes[0]?.count ?? 0),
    openTickets: Number(ticketsAbertos[0]?.count ?? 0),
    lowStockItems: artigosBaixos.map((a) => ({
      name: a.nome,
      slug: a.slug,
      quantity: a.quantidade,
    })),
  });
};

export const listarProdutos = async (_req: Request, res: Response): Promise<void> => {
  const products = await catalogo.listarProdutosAdmin();
  res.json({ products });
};

export const obterProduto = async (req: Request, res: Response): Promise<void> => {
  const slug = z.string().trim().min(1).max(80).parse(req.params.slug);
  const product = await catalogo.obterProdutoAdmin(slug);
  res.json({ product });
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
  tracking: z.string().trim().max(80).optional(),
});

export const obterPedido = async (req: Request, res: Response): Promise<void> => {
  const id = z.string().uuid().parse(req.params.id);
  const order = await pedidos.obterPorId(id);
  res.json({ order });
};

export const actualizarEstado = async (req: Request, res: Response): Promise<void> => {
  const id = z.string().uuid().parse(req.params.id);
  const { status, tracking } = estadoSchema.parse(req.body);
  const order =
    tracking !== undefined && tracking.length > 0
      ? await pedidos.alterarEstado(id, status, tracking)
      : await pedidos.alterarEstado(id, status);
  void emailEstadoPedido(
    order.customer.email,
    order.customer.name,
    order.reference,
    ROTULO_ESTADO[order.status] ?? order.status,
  );
  res.json({ ok: true, status: order.status, order });
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

export const listarUtilizadores = async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await query<{
    id: string;
    email: string;
    nome: string;
    perfil: string;
    telefone: string | null;
    cidade: string | null;
    activo: boolean;
    created_at: Date;
  }>(
    `SELECT id, email, nome, perfil, telefone, cidade, activo, created_at
     FROM utilizadores
     ORDER BY created_at DESC
     LIMIT 200`,
  );
  res.json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.nome,
      role: r.perfil,
      phone: r.telefone,
      city: r.cidade,
      active: r.activo,
      createdAt: r.created_at.toISOString(),
    })),
  });
};

export const listarTickets = async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await query<{
    id: string;
    categoria: string;
    assunto: string;
    descricao: string;
    estado: string;
    prioridade: string;
    created_at: Date;
    nome: string;
    email: string;
  }>(
    `SELECT t.id, t.categoria, t.assunto, t.descricao, t.estado, t.prioridade, t.created_at,
            u.nome, u.email
     FROM tickets t
     INNER JOIN utilizadores u ON u.id = t.utilizador_id
     ORDER BY t.created_at DESC
     LIMIT 100`,
  );
  res.json({
    tickets: rows.map((r) => ({
      id: r.id,
      category: r.categoria,
      subject: r.assunto,
      description: r.descricao,
      status: r.estado,
      priority: r.prioridade,
      createdAt: r.created_at.toISOString(),
      customerName: r.nome,
      customerEmail: r.email,
    })),
  });
};

const listaTexto = z.array(z.string().trim().min(1).max(200)).max(20);

const imagemSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((v) => v.startsWith('/') || /^https?:\/\//i.test(v), 'URL de imagem inválida');

const produtoCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(1).max(80),
  categorySlug: z.string().trim().min(1).max(80),
  price: z.number().positive('Indica o preço em Kwanzas.').max(50_000_000, 'Preço demasiado alto.'),
  oldPrice: z.number().positive().max(50_000_000).nullable().optional(),
  stock: z.number().int().min(0).max(100_000),
  description: z.string().trim().min(10, 'Descreve o artigo com pelo menos 10 caracteres.').max(4000),
  specs: listaTexto.default([]),
  images: z
    .array(imagemSchema)
    .min(1, 'Adiciona pelo menos uma fotografia.')
    .max(8, 'No máximo 8 fotografias.'),
  variantLabel: z.string().trim().min(1).max(40).default('Opção'),
  variantOptions: listaTexto.default(['Único']),
  badge: z.string().trim().max(40).nullable().optional(),
  featured: z.boolean().default(false),
  hero: z.boolean().default(false),
  sku: z.string().trim().max(40).optional(),
  slug: z.string().trim().max(80).optional(),
  warrantyMonths: z.number().int().min(1).max(120).nullable().optional(),
});

const produtoPatchSchema = produtoCreateSchema.partial().extend({
  active: z.boolean().optional(),
});

export const criarProduto = async (req: Request, res: Response): Promise<void> => {
  const body = produtoCreateSchema.parse(req.body);
  const product = await catalogo.criarProduto({
    name: body.name,
    brand: body.brand,
    categorySlug: body.categorySlug,
    price: body.price,
    oldPrice: body.oldPrice ?? null,
    stock: body.stock,
    description: body.description,
    specs: body.specs,
    images: body.images,
    variantLabel: body.variantLabel,
    variantOptions: body.variantOptions,
    badge: body.badge ?? null,
    featured: body.featured,
    hero: body.hero,
    warrantyMonths: body.warrantyMonths ?? null,
    ...(body.sku !== undefined ? { sku: body.sku } : {}),
    ...(body.slug !== undefined ? { slug: body.slug } : {}),
  });
  res.status(201).json({ product });
};

export const actualizarProduto = async (req: Request, res: Response): Promise<void> => {
  const slug = z.string().trim().min(1).max(80).parse(req.params.slug);
  const body = produtoPatchSchema.parse(req.body);
  const patch: Parameters<typeof catalogo.actualizarProduto>[1] = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.brand !== undefined) patch.brand = body.brand;
  if (body.categorySlug !== undefined) patch.categorySlug = body.categorySlug;
  if (body.price !== undefined) patch.price = body.price;
  if (body.oldPrice !== undefined) patch.oldPrice = body.oldPrice;
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.description !== undefined) patch.description = body.description;
  if (body.specs !== undefined) patch.specs = body.specs;
  if (body.images !== undefined) patch.images = body.images;
  if (body.variantLabel !== undefined) patch.variantLabel = body.variantLabel;
  if (body.variantOptions !== undefined) patch.variantOptions = body.variantOptions;
  if (body.badge !== undefined) patch.badge = body.badge;
  if (body.featured !== undefined) patch.featured = body.featured;
  if (body.hero !== undefined) patch.hero = body.hero;
  if (body.sku !== undefined) patch.sku = body.sku;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.warrantyMonths !== undefined) patch.warrantyMonths = body.warrantyMonths;
  if (body.active !== undefined) patch.active = body.active;
  const product = await catalogo.actualizarProduto(slug, patch);
  res.json({ product });
};

export const definirHero = async (req: Request, res: Response): Promise<void> => {
  const { slug } = z
    .object({ slug: z.string().trim().min(1).max(80).nullable() })
    .parse(req.body);
  const product = await catalogo.definirHero(slug);
  res.json({ ok: true, product });
};

const categoriaCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  order: z.number().int().min(0).max(999).default(0),
});

const categoriaPatchSchema = categoriaCreateSchema.partial();

export const listarCategorias = async (_req: Request, res: Response): Promise<void> => {
  const categories = await catalogo.listarCategoriasAdmin();
  res.json({ categories });
};

export const criarCategoria = async (req: Request, res: Response): Promise<void> => {
  const body = categoriaCreateSchema.parse(req.body);
  const category = await catalogo.criarCategoria({
    name: body.name,
    order: body.order,
    ...(body.slug !== undefined ? { slug: body.slug } : {}),
  });
  res.status(201).json({ category });
};

export const actualizarCategoria = async (req: Request, res: Response): Promise<void> => {
  const slug = z.string().trim().min(1).max(80).parse(req.params.slug);
  const body = categoriaPatchSchema.parse(req.body);
  const patch: { name?: string; slug?: string; order?: number } = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.order !== undefined) patch.order = body.order;
  const category = await catalogo.actualizarCategoria(slug, patch);
  res.json({ category });
};

export const eliminarCategoria = async (req: Request, res: Response): Promise<void> => {
  const slug = z.string().trim().min(1).max(80).parse(req.params.slug);
  await catalogo.eliminarCategoria(slug);
  res.json({ ok: true });
};

const utilizadorPatchSchema = z
  .object({
    active: z.boolean().optional(),
    role: z.enum(['cliente', 'admin']).optional(),
  })
  .refine((v) => v.active !== undefined || v.role !== undefined, {
    message: 'Indica active ou role.',
  });

export const actualizarUtilizador = async (req: Request, res: Response): Promise<void> => {
  const id = z.string().uuid().parse(req.params.id);
  const body = utilizadorPatchSchema.parse(req.body);
  const actorId = req.auth?.userId;
  if (actorId === id && body.active === false) {
    throw new AppError('FORBIDDEN', 'Não podes desactivar a tua própria conta.');
  }
  if (actorId === id && body.role === 'cliente') {
    throw new AppError('FORBIDDEN', 'Não podes remover o teu próprio perfil de admin.');
  }
  if (body.role === 'cliente' || body.active === false) {
    const { rows } = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM utilizadores WHERE perfil = 'admin' AND activo = true AND id <> $1`,
      [id],
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      throw new AppError('CONFLICT', 'Tem de existir pelo menos um administrador activo.');
    }
  }
  const campos: string[] = ['updated_at = now()'];
  const valores: unknown[] = [];
  let i = 1;
  if (body.active !== undefined) {
    campos.push(`activo = $${i++}`);
    valores.push(body.active);
  }
  if (body.role !== undefined) {
    campos.push(`perfil = $${i++}`);
    valores.push(body.role);
  }
  valores.push(id);
  const { rowCount } = await query(
    `UPDATE utilizadores SET ${campos.join(', ')} WHERE id = $${i}`,
    valores,
  );
  if (rowCount === 0) throw notFound('Utilizador');
  res.json({ ok: true });
};

const ticketEstadoSchema = z.object({
  status: z.enum(['aberto', 'em_analise', 'resolvido', 'fechado']),
});

export const actualizarTicket = async (req: Request, res: Response): Promise<void> => {
  const id = z.string().uuid().parse(req.params.id);
  const { status } = ticketEstadoSchema.parse(req.body);
  const { rowCount } = await query(
    `UPDATE tickets SET estado = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
  if (rowCount === 0) throw notFound('Ticket');
  res.json({ ok: true, status });
};

export const listarCupons = async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await query<{
    id: string;
    codigo: string;
    descricao: string | null;
    tipo: 'percentual' | 'fixo';
    valor: number;
    minimo_centimos: number;
    maximo_utilizacoes: number | null;
    utilizacoes: number;
    valido_de: Date;
    valido_ate: Date;
    activo: boolean;
  }>(
    `SELECT id, codigo, descricao, tipo, valor, minimo_centimos, maximo_utilizacoes,
            utilizacoes, valido_de, valido_ate, activo
     FROM cupons
     ORDER BY created_at DESC`,
  );
  res.json({
    coupons: rows.map((r) => ({
      id: r.id,
      code: r.codigo,
      description: r.descricao,
      type: r.tipo,
      value: r.valor,
      minEuros: eurosDeCentimos(r.minimo_centimos),
      maxUses: r.maximo_utilizacoes,
      uses: r.utilizacoes,
      validFrom: r.valido_de.toISOString(),
      validUntil: r.valido_ate.toISOString(),
      active: r.activo,
    })),
  });
};

const cupaoSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Z0-9_-]+$/i, 'Só letras, números, _ e -.'),
  description: z.string().trim().max(200).nullable().optional(),
  type: z.enum(['percentual', 'fixo']),
  value: z.number().int().positive().max(100_000),
  minEuros: z.number().min(0).max(50_000_000).default(0),
  maxUses: z.number().int().positive().max(1_000_000).nullable().optional(),
  validUntil: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Data inválida'),
});

export const criarCupao = async (req: Request, res: Response): Promise<void> => {
  const body = cupaoSchema.parse(req.body);
  if (body.type === 'percentual' && body.value > 90) {
    throw new AppError('VALIDATION_ERROR', 'Desconto percentual máximo: 90%.');
  }
  const minimo = Math.round(body.minEuros * 100);
  const valor = body.type === 'fixo' ? Math.round(body.value * 100) : body.value;
  try {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO cupons (codigo, descricao, tipo, valor, minimo_centimos, maximo_utilizacoes, valido_ate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        body.code.toUpperCase(),
        body.description ?? null,
        body.type,
        valor,
        minimo,
        body.maxUses ?? null,
        body.validUntil,
      ],
    );
    res.status(201).json({ id: rows[0]?.id, ok: true });
  } catch (erro) {
    const { isUniqueViolation } = await import('../utils/postgres.js');
    if (isUniqueViolation(erro)) throw new AppError('CONFLICT', 'Já existe um cupão com esse código.');
    throw erro;
  }
};

const cupaoPatchSchema = z.object({
  active: z.boolean(),
});

export const actualizarCupao = async (req: Request, res: Response): Promise<void> => {
  const id = z.string().uuid().parse(req.params.id);
  const { active } = cupaoPatchSchema.parse(req.body);
  const { rowCount } = await query(`UPDATE cupons SET activo = $1 WHERE id = $2`, [active, id]);
  if (rowCount === 0) throw notFound('Cupão');
  res.json({ ok: true });
};

