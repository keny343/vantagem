import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../src/utils/errors.js';
import * as pedidos from '../src/services/pedidos.service.js';
import {
  criarClienteTeste,
  criarProdutoComStock,
  fecharBaseTeste,
  limparPedidosEStock,
  postgresDisponivel,
  prepararBaseTeste,
  stockDe,
} from './helpers/db.js';

const clientePedido = (nome: string) => ({
  name: nome,
  email: `${nome.replace(/\s+/g, '').toLowerCase()}@vantagem.test`,
  phone: '923000001',
  address: 'Rua Teste 1',
  postalCode: '—',
  city: 'Luanda',
});

describe('checkout / stock na confirmação (Postgres)', () => {
  let ativo = false;

  beforeAll(async () => {
    ativo = await postgresDisponivel();
    if (process.env.CI === 'true' && !ativo) {
      throw new Error('Postgres de CI inacessível — o job backend precisa do service postgres.');
    }
    if (!ativo) return;
    await prepararBaseTeste();
  }, 60_000);

  beforeEach(async () => {
    if (!ativo) return;
    await limparPedidosEStock();
  });

  afterAll(async () => {
    if (ativo) await fecharBaseTeste();
  });

  it('checkout não consome stock; confirmação de pagamento consome', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `debit-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 3 });
    const userId = await criarClienteTeste(slug);

    const criado = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Debit'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: `idem-debit-${slug}`,
    });

    expect(criado.status).toBe('pendente');
    expect(await stockDe(produto.produtoId)).toBe(3);

    const pago = await pedidos.alterarEstado(criado.id, 'pago');
    expect(pago.status).toBe('pago');
    expect(await stockDe(produto.produtoId)).toBe(2);
  }, 30_000);

  it('só um de dois checkouts paralelos reserva a última unidade', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `soft-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 1 });
    const u1 = await criarClienteTeste(`a-${slug}`);
    const u2 = await criarClienteTeste(`b-${slug}`);

    const resultados = await Promise.allSettled([
      pedidos.criarPedido({
        items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
        customer: clientePedido(u1.slice(0, 8)),
        paymentMethod: 'cartao',
        userId: u1,
        idempotencyKey: `idem-${slug}-1`,
      }),
      pedidos.criarPedido({
        items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
        customer: clientePedido(u2.slice(0, 8)),
        paymentMethod: 'cartao',
        userId: u2,
        idempotencyKey: `idem-${slug}-2`,
      }),
    ]);

    const ok = resultados.filter((r) => r.status === 'fulfilled');
    const falhas = resultados.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(1);
    expect(falhas).toHaveLength(1);
    expect(await stockDe(produto.produtoId)).toBe(1);

    const rejeitado = falhas[0];
    expect(rejeitado?.status).toBe('rejected');
    if (rejeitado?.status === 'rejected') {
      expect(rejeitado.reason).toBeInstanceOf(AppError);
      expect((rejeitado.reason as AppError).code).toBe('INSUFFICIENT_STOCK');
    }

    const criado = ok[0];
    expect(criado?.status).toBe('fulfilled');
    if (criado?.status === 'fulfilled') {
      await pedidos.alterarEstado(criado.value.id, 'pago');
      expect(await stockDe(produto.produtoId)).toBe(0);
    }
  }, 30_000);

  it('só uma de duas confirmações paralelas fica com o último stock', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `stock-race-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 1 });
    const u1 = await criarClienteTeste(`a-${slug}`);
    const u2 = await criarClienteTeste(`b-${slug}`);

    const p1 = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido(u1.slice(0, 8)),
      paymentMethod: 'cartao',
      userId: u1,
      idempotencyKey: `idem-${slug}-1`,
    });

    // Simula oversell legado: segunda encomenda criada após elevar stock e voltar a 1
    // sem soft-count — aqui elevamos stock, criamos p2, e forçamos stock físico a 1.
    const { query } = await import('../src/config/database.js');
    await query(`UPDATE stock SET quantidade = 2 WHERE produto_id = $1`, [produto.produtoId]);
    const p2 = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido(u2.slice(0, 8)),
      paymentMethod: 'cartao',
      userId: u2,
      idempotencyKey: `idem-${slug}-2`,
    });
    await query(`UPDATE stock SET quantidade = 1 WHERE produto_id = $1`, [produto.produtoId]);

    expect(await stockDe(produto.produtoId)).toBe(1);

    const resultados = await Promise.allSettled([
      pedidos.alterarEstado(p1.id, 'pago'),
      pedidos.alterarEstado(p2.id, 'pago'),
    ]);

    const ok = resultados.filter((r) => r.status === 'fulfilled');
    const falhas = resultados.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(1);
    expect(falhas).toHaveLength(1);

    const rejeitado = falhas[0];
    expect(rejeitado?.status).toBe('rejected');
    if (rejeitado?.status === 'rejected') {
      expect(rejeitado.reason).toBeInstanceOf(AppError);
      expect((rejeitado.reason as AppError).code).toBe('INSUFFICIENT_STOCK');
    }

    expect(await stockDe(produto.produtoId)).toBe(0);
  }, 30_000);

  it('idempotencyKey de outro utilizador não devolve o pedido', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `idem-own-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 3 });
    const u1 = await criarClienteTeste(`a-${slug}`);
    const u2 = await criarClienteTeste(`b-${slug}`);
    const chave = `idem-own-key-${slug}`;

    await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Owner A'),
      paymentMethod: 'cartao',
      userId: u1,
      idempotencyKey: chave,
    });

    await expect(
      pedidos.criarPedido({
        items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
        customer: clientePedido('Owner B'),
        paymentMethod: 'cartao',
        userId: u2,
        idempotencyKey: chave,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  }, 30_000);

  it('repete a mesma idempotencyKey sem criar outro pedido nem mexer no stock', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `idem-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 2 });
    const userId = await criarClienteTeste(slug);
    const chave = `idem-key-${slug}`;

    const primeiro = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Idem Um'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: chave,
    });

    const segundo = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Idem Dois'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: chave,
    });

    expect(segundo.reference).toBe(primeiro.reference);
    expect(await stockDe(produto.produtoId)).toBe(2);
  }, 30_000);

  it('cancelar pendente não repõe stock; cancelar pago repõe', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `cancel-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 5 });
    const userId = await criarClienteTeste(slug);

    const pendente = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 2 }],
      customer: clientePedido('Cancel Pend'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: `idem-c1-${slug}`,
    });
    await pedidos.alterarEstado(pendente.id, 'cancelado');
    expect(await stockDe(produto.produtoId)).toBe(5);

    const pago = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 2 }],
      customer: clientePedido('Cancel Pago'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: `idem-c2-${slug}`,
    });
    await pedidos.alterarEstado(pago.id, 'pago');
    expect(await stockDe(produto.produtoId)).toBe(3);
    await pedidos.alterarEstado(pago.id, 'cancelado');
    expect(await stockDe(produto.produtoId)).toBe(5);
  }, 30_000);
});
