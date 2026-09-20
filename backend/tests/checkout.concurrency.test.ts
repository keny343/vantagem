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

describe('checkout concorrente (Postgres)', () => {
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

  it('só uma de duas compras paralelas fica com o último stock', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `stock-race-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 1 });
    const u1 = await criarClienteTeste(`a-${slug}`);
    const u2 = await criarClienteTeste(`b-${slug}`);

    const compra = (userId: string, chave: string) =>
      pedidos.criarPedido({
        items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
        customer: clientePedido(userId.slice(0, 8)),
        paymentMethod: 'cartao',
        userId,
        idempotencyKey: chave,
      });

    const resultados = await Promise.allSettled([
      compra(u1, `idem-${slug}-1`),
      compra(u2, `idem-${slug}-2`),
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

  it('repete a mesma idempotencyKey sem consumir stock outra vez', async ({ skip }) => {
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
    expect(await stockDe(produto.produtoId)).toBe(1);
  }, 30_000);

  it('marca pendente → pago sem erro de tipos no Postgres', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `pago-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 3 });
    const userId = await criarClienteTeste(slug);

    const criado = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Pago Enum'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: `idem-pago-${slug}`,
    });

    expect(criado.status).toBe('pendente');

    const actualizado = await pedidos.alterarEstado(criado.id, 'pago');
    expect(actualizado.status).toBe('pago');
    expect(actualizado.paidAt).toBeTruthy();
  }, 30_000);
});
