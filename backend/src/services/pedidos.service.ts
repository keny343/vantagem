import { query, transaction } from '../config/database.js';
import type { Autenticado, EstadoPedido, MetodoPagamento } from '../types/domain.js';
import { eurosDeCentimos } from '../types/domain.js';
import { AppError, notFound } from '../utils/errors.js';

const ENVIO_GRATIS_A_PARTIR = 9000; // 90,00 €
const CUSTO_ENVIO = 490; // 4,90 €

interface ItemInput {
  productId: string;
  variant: string;
  quantity: number;
}

interface CustomerInput {
  name: string;
  email: string;
  phone?: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface PedidoPublico {
  id: string;
  reference: string;
  status: EstadoPedido;
  paymentMethod: MetodoPagamento;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address: string;
    postalCode: string;
    city: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: {
    sku: string;
    name: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

const novaReferencia = (): string => {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `VNT-${n}`;
};

export const criarPedido = async (dados: {
  items: ItemInput[];
  customer: CustomerInput;
  paymentMethod: MetodoPagamento;
  userId: string | null;
}): Promise<PedidoPublico> => {
  return transaction(async (client) => {
    let subtotal = 0;
    const linhas: {
      produtoId: string;
      sku: string;
      nome: string;
      variante: string;
      quantidade: number;
      precoUnitario: number;
      total: number;
    }[] = [];

    for (const item of dados.items) {
      const { rows } = await client.query<{
        id: string;
        sku: string;
        nome: string;
        preco_centimos: number;
        variante_opcoes: string[] | string;
        quantidade: number;
        activo: boolean;
      }>(
        `SELECT p.id, p.sku, p.nome, p.preco_centimos, p.variante_opcoes, p.activo, s.quantidade
         FROM produtos p
         INNER JOIN stock s ON s.produto_id = p.id
         WHERE p.slug = $1
         FOR UPDATE OF s`,
        [item.productId],
      );
      const produto = rows[0];
      if (produto === undefined || !produto.activo) {
        throw new AppError('NOT_FOUND', `Produto ${item.productId} não encontrado.`);
      }

      const opcoes = Array.isArray(produto.variante_opcoes)
        ? produto.variante_opcoes.map(String)
        : (JSON.parse(String(produto.variante_opcoes)) as string[]);
      if (!opcoes.includes(item.variant)) {
        throw new AppError('VALIDATION_ERROR', `Variante inválida para ${produto.nome}.`, {
          details: [{ field: 'variant', message: item.variant }],
        });
      }

      if (produto.quantidade < item.quantity) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Stock insuficiente para ${produto.nome} (disponível: ${produto.quantidade}).`,
        );
      }

      await client.query(
        `UPDATE stock SET quantidade = quantidade - $1, actualizado_em = now()
         WHERE produto_id = $2`,
        [item.quantity, produto.id],
      );

      const totalLinha = produto.preco_centimos * item.quantity;
      subtotal += totalLinha;
      linhas.push({
        produtoId: produto.id,
        sku: produto.sku,
        nome: produto.nome,
        variante: item.variant,
        quantidade: item.quantity,
        precoUnitario: produto.preco_centimos,
        total: totalLinha,
      });
    }

    const envio = subtotal === 0 || subtotal >= ENVIO_GRATIS_A_PARTIR ? 0 : CUSTO_ENVIO;
    const total = subtotal + envio;

    let referencia = novaReferencia();
    for (let i = 0; i < 5; i += 1) {
      const existe = await client.query(`SELECT 1 FROM pedidos WHERE referencia = $1`, [referencia]);
      if (existe.rowCount === 0) break;
      referencia = novaReferencia();
    }

    const { rows: pedidoRows } = await client.query<{
      id: string;
      referencia: string;
      estado: EstadoPedido;
      metodo_pagamento: MetodoPagamento;
      cliente_nome: string;
      cliente_email: string;
      cliente_telefone: string | null;
      morada: string;
      codigo_postal: string;
      cidade: string;
      subtotal_centimos: number;
      envio_centimos: number;
      total_centimos: number;
      created_at: Date;
    }>(
      `INSERT INTO pedidos (
         referencia, utilizador_id, estado, metodo_pagamento,
         cliente_nome, cliente_email, cliente_telefone,
         morada, codigo_postal, cidade,
         subtotal_centimos, envio_centimos, total_centimos
       ) VALUES (
         $1, $2, 'pago', $3,
         $4, $5, $6,
         $7, $8, $9,
         $10, $11, $12
       )
       RETURNING *`,
      [
        referencia,
        dados.userId,
        dados.paymentMethod,
        dados.customer.name,
        dados.customer.email,
        dados.customer.phone ?? null,
        dados.customer.address,
        dados.customer.postalCode,
        dados.customer.city,
        subtotal,
        envio,
        total,
      ],
    );
    const pedido = pedidoRows[0];
    if (pedido === undefined) throw new AppError('INTERNAL_ERROR', 'Falha ao criar pedido.');

    for (const linha of linhas) {
      await client.query(
        `INSERT INTO itens_de_pedido (
           pedido_id, produto_id, sku, nome, variante, quantidade,
           preco_unitario_centimos, total_centimos
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          pedido.id,
          linha.produtoId,
          linha.sku,
          linha.nome,
          linha.variante,
          linha.quantidade,
          linha.precoUnitario,
          linha.total,
        ],
      );
      await client.query(`UPDATE produtos SET vendidos = vendidos + $1 WHERE id = $2`, [
        linha.quantidade,
        linha.produtoId,
      ]);
    }

    return {
      id: pedido.id,
      reference: pedido.referencia,
      status: pedido.estado,
      paymentMethod: pedido.metodo_pagamento,
      customer: {
        name: pedido.cliente_nome,
        email: pedido.cliente_email,
        phone: pedido.cliente_telefone,
        address: pedido.morada,
        postalCode: pedido.codigo_postal,
        city: pedido.cidade,
      },
      subtotal: eurosDeCentimos(pedido.subtotal_centimos),
      shipping: eurosDeCentimos(pedido.envio_centimos),
      total: eurosDeCentimos(pedido.total_centimos),
      createdAt: pedido.created_at.toISOString(),
      items: linhas.map((l) => ({
        sku: l.sku,
        name: l.nome,
        variant: l.variante,
        quantity: l.quantidade,
        unitPrice: eurosDeCentimos(l.precoUnitario),
        total: eurosDeCentimos(l.total),
      })),
    };
  });
};

const mapearPedido = (
  pedido: {
    id: string;
    referencia: string;
    estado: EstadoPedido;
    metodo_pagamento: MetodoPagamento;
    cliente_nome: string;
    cliente_email: string;
    cliente_telefone: string | null;
    morada: string;
    codigo_postal: string;
    cidade: string;
    subtotal_centimos: number;
    envio_centimos: number;
    total_centimos: number;
    created_at: Date;
  },
  items: {
    sku: string;
    nome: string;
    variante: string;
    quantidade: number;
    preco_unitario_centimos: number;
    total_centimos: number;
  }[],
): PedidoPublico => ({
  id: pedido.id,
  reference: pedido.referencia,
  status: pedido.estado,
  paymentMethod: pedido.metodo_pagamento,
  customer: {
    name: pedido.cliente_nome,
    email: pedido.cliente_email,
    phone: pedido.cliente_telefone,
    address: pedido.morada,
    postalCode: pedido.codigo_postal,
    city: pedido.cidade,
  },
  subtotal: eurosDeCentimos(pedido.subtotal_centimos),
  shipping: eurosDeCentimos(pedido.envio_centimos),
  total: eurosDeCentimos(pedido.total_centimos),
  createdAt: pedido.created_at.toISOString(),
  items: items.map((i) => ({
    sku: i.sku,
    name: i.nome,
    variant: i.variante,
    quantity: i.quantidade,
    unitPrice: eurosDeCentimos(i.preco_unitario_centimos),
    total: eurosDeCentimos(i.total_centimos),
  })),
});

export const pedidosDoUtilizador = async (userId: string): Promise<PedidoPublico[]> => {
  const { rows } = await query<{
    id: string;
    referencia: string;
    estado: EstadoPedido;
    metodo_pagamento: MetodoPagamento;
    cliente_nome: string;
    cliente_email: string;
    cliente_telefone: string | null;
    morada: string;
    codigo_postal: string;
    cidade: string;
    subtotal_centimos: number;
    envio_centimos: number;
    total_centimos: number;
    created_at: Date;
  }>(
    `SELECT * FROM pedidos WHERE utilizador_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );

  const resultado: PedidoPublico[] = [];
  for (const p of rows) {
    const { rows: items } = await query<{
      sku: string;
      nome: string;
      variante: string;
      quantidade: number;
      preco_unitario_centimos: number;
      total_centimos: number;
    }>(`SELECT sku, nome, variante, quantidade, preco_unitario_centimos, total_centimos
        FROM itens_de_pedido WHERE pedido_id = $1`, [p.id]);
    resultado.push(mapearPedido(p, items));
  }
  return resultado;
};

export const obterPorReferencia = async (
  referencia: string,
  sessao: Autenticado | null,
): Promise<PedidoPublico> => {
  const { rows } = await query<{
    id: string;
    referencia: string;
    estado: EstadoPedido;
    metodo_pagamento: MetodoPagamento;
    cliente_nome: string;
    cliente_email: string;
    cliente_telefone: string | null;
    morada: string;
    codigo_postal: string;
    cidade: string;
    subtotal_centimos: number;
    envio_centimos: number;
    total_centimos: number;
    created_at: Date;
    utilizador_id: string | null;
  }>(`SELECT * FROM pedidos WHERE referencia = $1 LIMIT 1`, [referencia]);
  const pedido = rows[0];
  if (pedido === undefined) throw notFound('Pedido');

  const eDono =
    sessao !== null &&
    (sessao.perfil === 'admin' ||
      (pedido.utilizador_id !== null && pedido.utilizador_id === sessao.userId) ||
      pedido.cliente_email.toLowerCase() === sessao.email.toLowerCase());

  if (!eDono && sessao?.perfil !== 'admin') {
    // Avoid leaking whether a reference exists to strangers.
    throw notFound('Pedido');
  }

  const { rows: items } = await query<{
    sku: string;
    nome: string;
    variante: string;
    quantidade: number;
    preco_unitario_centimos: number;
    total_centimos: number;
  }>(`SELECT sku, nome, variante, quantidade, preco_unitario_centimos, total_centimos
      FROM itens_de_pedido WHERE pedido_id = $1`, [pedido.id]);

  return mapearPedido(pedido, items);
};
