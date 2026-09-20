import { randomBytes } from 'node:crypto';
import { query, transaction } from '../config/database.js';
import { descontoDeCupao, envioDe, ivaIncluidoDe, LOJA } from '../config/loja.js';
import type { EstadoPedido, MetodoPagamento } from '../types/domain.js';
import { eurosDeCentimos } from '../types/domain.js';
import { AppError, notFound } from '../utils/errors.js';
import { isUniqueViolation } from '../utils/postgres.js';

interface ItemInput {
  productId: string;
  variant: string;
  quantity: number;
}

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  nif?: string;
}

export interface PedidoPublico {
  id: string;
  reference: string;
  status: EstadoPedido;
  paymentMethod: MetodoPagamento;
  nif: string | null;
  couponCode: string | null;
  discount: number;
  vat: number;
  mbEntity: string | null;
  mbReference: string | null;
  tracking: string | null;
  paidAt: string | null;
  comprovativoUrl: string | null;
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
    productId: string | null;
    sku: string;
    name: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

interface PedidoRow {
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
  nif: string | null;
  subtotal_centimos: number;
  envio_centimos: number;
  desconto_centimos: number;
  iva_centimos: number;
  total_centimos: number;
  cupao_codigo: string | null;
  mb_entidade: string | null;
  mb_referencia: string | null;
  tracking: string | null;
  comprovativo_url: string | null;
  pago_em: Date | null;
  stock_reposto: boolean;
  created_at: Date;
  utilizador_id: string | null;
  cupao_id: string | null;
}

interface ItemRow {
  produto_id: string | null;
  produto_slug: string | null;
  sku: string;
  nome: string;
  variante: string;
  quantidade: number;
  preco_unitario_centimos: number;
  total_centimos: number;
}

const novaReferencia = (): string => `VNT-${randomBytes(6).toString('hex').toUpperCase()}`;

const mbReferenciaDe = (pedidoId: string): string => {
  const n = Number.parseInt(pedidoId.replace(/-/g, '').slice(0, 12), 16);
  return String(Math.abs(n) % 1_000_000_000).padStart(9, '0');
};

const reporStockSePreciso = async (
  client: { query: typeof query },
  pedido: PedidoRow,
  items: ItemRow[],
): Promise<void> => {
  if (pedido.stock_reposto) return;
  if (pedido.estado === 'enviado' || pedido.estado === 'entregue') return;

  for (const item of items) {
    if (item.produto_id === null) continue;
    await client.query(
      `UPDATE stock SET quantidade = quantidade + $1, actualizado_em = now()
       WHERE produto_id = $2`,
      [item.quantidade, item.produto_id],
    );
    if (pedido.estado !== 'pendente') {
      await client.query(
        `UPDATE produtos SET vendidos = GREATEST(vendidos - $1, 0) WHERE id = $2`,
        [item.quantidade, item.produto_id],
      );
    }
  }

  if (pedido.cupao_id !== null) {
    await client.query(
      `UPDATE cupons SET utilizacoes = GREATEST(utilizacoes - 1, 0) WHERE id = $1`,
      [pedido.cupao_id],
    );
  }

  await client.query(`UPDATE pedidos SET stock_reposto = true, updated_at = now() WHERE id = $1`, [
    pedido.id,
  ]);
};

const mapearPedido = (pedido: PedidoRow, items: ItemRow[]): PedidoPublico => ({
  id: pedido.id,
  reference: pedido.referencia,
  status: pedido.estado,
  paymentMethod: pedido.metodo_pagamento,
  nif: pedido.nif,
  couponCode: pedido.cupao_codigo,
  discount: eurosDeCentimos(pedido.desconto_centimos),
  vat: eurosDeCentimos(pedido.iva_centimos),
  mbEntity: pedido.mb_entidade,
  mbReference: pedido.mb_referencia,
  tracking: pedido.tracking,
  paidAt: pedido.pago_em === null ? null : pedido.pago_em.toISOString(),
  comprovativoUrl: pedido.comprovativo_url ?? null,
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
    // Público: slug (igual a product.id na API de catálogo)
    productId: i.produto_slug ?? i.produto_id,
    sku: i.sku,
    name: i.nome,
    variant: i.variante,
    quantity: i.quantidade,
    unitPrice: eurosDeCentimos(i.preco_unitario_centimos),
    total: eurosDeCentimos(i.total_centimos),
  })),
});

const carregarItems = async (
  client: { query: typeof query },
  pedidoId: string,
): Promise<ItemRow[]> => {
  const { rows } = await client.query<ItemRow>(
    `SELECT i.produto_id, p.slug AS produto_slug, i.sku, i.nome, i.variante,
            i.quantidade, i.preco_unitario_centimos, i.total_centimos
     FROM itens_de_pedido i
     LEFT JOIN produtos p ON p.id = i.produto_id
     WHERE i.pedido_id = $1`,
    [pedidoId],
  );
  return rows;
};

const obterRowPorReferencia = async (
  client: { query: typeof query },
  referencia: string,
): Promise<PedidoRow | null> => {
  const { rows } = await client.query<PedidoRow>(
    `SELECT * FROM pedidos WHERE referencia = $1 LIMIT 1`,
    [referencia],
  );
  return rows[0] ?? null;
};

export const criarPedido = async (dados: {
  items: ItemInput[];
  customer: CustomerInput;
  paymentMethod: MetodoPagamento;
  userId: string | null;
  couponCode?: string;
  idempotencyKey?: string;
}): Promise<PedidoPublico> => {
  if (dados.idempotencyKey !== undefined && dados.idempotencyKey.length > 0) {
    const { rows } = await query<PedidoRow>(
      `SELECT * FROM pedidos WHERE idempotency_key = $1 LIMIT 1`,
      [dados.idempotencyKey],
    );
    if (rows[0] !== undefined) {
      const items = await carregarItems({ query }, rows[0].id);
      return mapearPedido(rows[0], items);
    }
  }

  try {
    return await transaction(async (client) => {
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

      let cupaoId: string | null = null;
      let cupaoCodigo: string | null = null;
      let desconto = 0;
      const codigo = dados.couponCode?.trim();
      if (codigo !== undefined && codigo.length > 0) {
        const { rows: cupaoRows } = await client.query<{
          id: string;
          codigo: string;
          tipo: 'percentual' | 'fixo';
          valor: number;
          minimo_centimos: number;
        }>(
          `SELECT id, codigo, tipo, valor, minimo_centimos
           FROM cupons
           WHERE lower(codigo) = lower($1)
             AND activo = true
             AND now() BETWEEN valido_de AND valido_ate
             AND (maximo_utilizacoes IS NULL OR utilizacoes < maximo_utilizacoes)
           FOR UPDATE`,
          [codigo],
        );
        const cupao = cupaoRows[0];
        if (cupao === undefined) {
          throw new AppError('VALIDATION_ERROR', 'Cupão inválido ou expirado.', {
            details: [{ field: 'couponCode', message: codigo }],
          });
        }
        if (subtotal < cupao.minimo_centimos) {
          throw new AppError(
            'VALIDATION_ERROR',
            `Este cupão exige um subtotal mínimo de ${eurosDeCentimos(cupao.minimo_centimos).toLocaleString('pt-AO')} Kz.`,
          );
        }
        desconto = descontoDeCupao(cupao.tipo, cupao.valor, subtotal);
        cupaoId = cupao.id;
        cupaoCodigo = cupao.codigo;
      }

      const envio = envioDe(subtotal);
      const total = subtotal - desconto + envio;
      const iva = ivaIncluidoDe(total);

      let mbEntidade: string | null = null;
      let mbRef: string | null = null;
      if (dados.paymentMethod === 'multibanco') {
        mbEntidade = LOJA.mbEntidade;
      }

      const referencia = novaReferencia();

      const { rows: pedidoRows } = await client.query<PedidoRow>(
        `INSERT INTO pedidos (
           referencia, utilizador_id, estado, metodo_pagamento,
           cliente_nome, cliente_email, cliente_telefone,
           morada, codigo_postal, cidade, nif,
           subtotal_centimos, envio_centimos, desconto_centimos, iva_centimos, total_centimos,
           cupao_id, cupao_codigo, mb_entidade, mb_referencia, idempotency_key
         ) VALUES (
           $1, $2, 'pendente', $3,
           $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14, $15,
           $16, $17, $18, $19, $20
         )
         RETURNING *`,
        [
          referencia,
          dados.userId,
          dados.paymentMethod,
          dados.customer.name,
          dados.customer.email,
          dados.customer.phone,
          dados.customer.address,
          dados.customer.postalCode,
          dados.customer.city,
          dados.customer.nif ?? null,
          subtotal,
          envio,
          desconto,
          iva,
          total,
          cupaoId,
          cupaoCodigo,
          mbEntidade,
          mbRef,
          dados.idempotencyKey ?? null,
        ],
      );
      const pedido = pedidoRows[0];
      if (pedido === undefined) throw new AppError('INTERNAL_ERROR', 'Falha ao criar pedido.');

      if (dados.paymentMethod === 'multibanco') {
        mbRef = mbReferenciaDe(pedido.id);
        await client.query(`UPDATE pedidos SET mb_referencia = $1 WHERE id = $2`, [mbRef, pedido.id]);
        pedido.mb_referencia = mbRef;
      }

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
      }

      if (cupaoId !== null) {
        await client.query(
          `INSERT INTO cupons_utilizador (cupao_id, utilizador_id, pedido_id)
           VALUES ($1, $2, $3)`,
          [cupaoId, dados.userId, pedido.id],
        );
        await client.query(`UPDATE cupons SET utilizacoes = utilizacoes + 1 WHERE id = $1`, [cupaoId]);
      }

      const items = await carregarItems(client, pedido.id);
      return mapearPedido(pedido, items);
    });
  } catch (erro) {
    if (isUniqueViolation(erro) && dados.idempotencyKey !== undefined) {
      const { rows } = await query<PedidoRow>(
        `SELECT * FROM pedidos WHERE idempotency_key = $1 LIMIT 1`,
        [dados.idempotencyKey],
      );
      if (rows[0] !== undefined) {
        const items = await carregarItems({ query }, rows[0].id);
        return mapearPedido(rows[0], items);
      }
    }
    throw erro;
  }
};

export const confirmarPagamento = async (referencia: string): Promise<PedidoPublico> => {
  return transaction(async (client) => {
    const pedido = await obterRowPorReferencia(client, referencia);
    if (pedido === null) throw notFound('Pedido');

    if (pedido.estado !== 'pendente') {
      const items = await carregarItems(client, pedido.id);
      return mapearPedido(pedido, items);
    }

    const items = await carregarItems(client, pedido.id);
    for (const item of items) {
      if (item.produto_id === null) continue;
      await client.query(`UPDATE produtos SET vendidos = vendidos + $1 WHERE id = $2`, [
        item.quantidade,
        item.produto_id,
      ]);
    }

    const { rows } = await client.query<PedidoRow>(
      `UPDATE pedidos
       SET estado = 'pago', pago_em = now(), updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [pedido.id],
    );
    const actualizado = rows[0];
    if (actualizado === undefined) throw new AppError('INTERNAL_ERROR', 'Falha ao confirmar pagamento.');
    return mapearPedido(actualizado, items);
  });
};

export const alterarEstado = async (
  id: string,
  novo: EstadoPedido,
  tracking?: string,
): Promise<PedidoPublico> => {
  return transaction(async (client) => {
    const { rows } = await client.query<PedidoRow>(
      `SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const pedido = rows[0];
    if (pedido === undefined) throw notFound('Pedido');
    if (pedido.estado === 'cancelado' && novo !== 'cancelado') {
      throw new AppError('VALIDATION_ERROR', 'Um pedido cancelado não pode voltar a abrir.');
    }

    const items = await carregarItems(client, pedido.id);

    if (novo === 'cancelado' && pedido.estado !== 'cancelado') {
      await reporStockSePreciso(client, pedido, items);
    }

    if (pedido.estado === 'pendente' && novo === 'pago') {
      for (const item of items) {
        if (item.produto_id === null) continue;
        await client.query(`UPDATE produtos SET vendidos = vendidos + $1 WHERE id = $2`, [
          item.quantidade,
          item.produto_id,
        ]);
      }
    }

    const { rows: actualizados } = await client.query<PedidoRow>(
      `UPDATE pedidos
       SET estado = $1,
           tracking = COALESCE($2, tracking),
           pago_em = CASE WHEN $1 = 'pago' AND pago_em IS NULL THEN now() ELSE pago_em END,
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [novo, tracking ?? null, id],
    );
    const actualizado = actualizados[0];
    if (actualizado === undefined) throw notFound('Pedido');
    return mapearPedido(actualizado, items);
  });
};

export const pedidosDoUtilizador = async (userId: string): Promise<PedidoPublico[]> => {
  const { rows } = await query<PedidoRow>(
    `SELECT * FROM pedidos WHERE utilizador_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
  const resultado: PedidoPublico[] = [];
  for (const p of rows) {
    resultado.push(mapearPedido(p, await carregarItems({ query }, p.id)));
  }
  return resultado;
};

export const obterPorReferencia = async (referencia: string): Promise<PedidoPublico> => {
  const pedido = await obterRowPorReferencia({ query }, referencia);
  if (pedido === null) throw notFound('Pedido');
  return mapearPedido(pedido, await carregarItems({ query }, pedido.id));
};

export const obterPorId = async (id: string): Promise<PedidoPublico> => {
  const { rows } = await query<PedidoRow>(`SELECT * FROM pedidos WHERE id = $1 LIMIT 1`, [id]);
  const pedido = rows[0];
  if (pedido === undefined) throw notFound('Pedido');
  return mapearPedido(pedido, await carregarItems({ query }, pedido.id));
};

export const guardarComprovativo = async (
  referencia: string,
  url: string,
): Promise<PedidoPublico> => {
  const pedido = await obterRowPorReferencia({ query }, referencia);
  if (pedido === null) throw notFound('Pedido');
  if (pedido.estado !== 'pendente') {
    throw new AppError('VALIDATION_ERROR', 'Esta encomenda já não espera comprovativo.');
  }
  if (pedido.metodo_pagamento !== 'cartao') {
    throw new AppError('VALIDATION_ERROR', 'O comprovativo só se aplica à transferência.');
  }
  const { rows } = await query<PedidoRow>(
    `UPDATE pedidos SET comprovativo_url = $1, updated_at = now()
     WHERE id = $2 RETURNING *`,
    [url, pedido.id],
  );
  const actualizado = rows[0];
  if (actualizado === undefined) throw notFound('Pedido');
  return mapearPedido(actualizado, await carregarItems({ query }, actualizado.id));
};
