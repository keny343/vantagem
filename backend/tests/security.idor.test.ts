import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../src/utils/errors.js';
import * as pedidos from '../src/services/pedidos.service.js';
import * as devolucoes from '../src/repositories/devolucoes.repository.js';
import { guardarFicheiro } from '../src/services/storage.service.js';
import {
  criarClienteTeste,
  criarProdutoComStock,
  fecharBaseTeste,
  limparPedidosEStock,
  postgresDisponivel,
  prepararBaseTeste,
} from './helpers/db.js';

const clientePedido = (nome: string) => ({
  name: nome,
  email: `${nome.replace(/\s+/g, '').toLowerCase()}@vantagem.test`,
  phone: '923000001',
  address: 'Rua Teste 1',
  postalCode: '—',
  city: 'Luanda',
});

describe('segurança / IDOR e ownership (Postgres)', () => {
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

  it('cliente B não lê pedido de A', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `idor-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 2 });
    const a = await criarClienteTeste(`a-${slug}`);
    const b = await criarClienteTeste(`b-${slug}`);

    const pedido = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('IDOR A'),
      paymentMethod: 'cartao',
      userId: a,
      idempotencyKey: `idem-idor-${slug}`,
    });

    await expect(
      pedidos.obterPorReferenciaAutorizado(pedido.reference, { userId: b, perfil: 'cliente' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const proprio = await pedidos.obterPorReferenciaAutorizado(pedido.reference, {
      userId: a,
      perfil: 'cliente',
    });
    expect(proprio.reference).toBe(pedido.reference);
  }, 30_000);

  it('cliente B não cria devolução no pedido de A', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `dev-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 2 });
    const a = await criarClienteTeste(`a-${slug}`);
    const b = await criarClienteTeste(`b-${slug}`);

    const pedido = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Dev A'),
      paymentMethod: 'cartao',
      userId: a,
      idempotencyKey: `idem-dev-${slug}`,
    });

    await expect(
      devolucoes.criarDevolucao(b, pedido.id, { motivo: 'defeito' }),
    ).rejects.toBeInstanceOf(AppError);
  }, 30_000);

  it('comprovativo na API nunca expõe URL pública de storage', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `proof-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 2 });
    const userId = await criarClienteTeste(slug);

    const pedido = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Proof'),
      paymentMethod: 'cartao',
      userId,
      idempotencyKey: `idem-proof-${slug}`,
    });

    const chave = await guardarFicheiro(
      {
        buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
        mimetype: 'application/pdf',
        originalname: 'comprovativo.pdf',
      },
      'comprovativos',
    );
    expect(chave.startsWith('comprovativos/')).toBe(true);
    expect(chave.includes('object/public')).toBe(false);

    const actualizado = await pedidos.guardarComprovativo(pedido.reference, chave, {
      userId,
      perfil: 'cliente',
    });
    expect(actualizado.comprovativoUrl).toBe(
      `/api/pedidos/${encodeURIComponent(pedido.reference)}/comprovativo`,
    );
    expect(actualizado.comprovativoUrl?.includes('supabase')).toBe(false);
  }, 30_000);

  it('cliente B não obtém chave do comprovativo de A', async ({ skip }) => {
    if (!ativo) {
      skip();
      return;
    }

    const slug = `proof2-${randomUUID().slice(0, 8)}`;
    const produto = await criarProdutoComStock({ slug, stock: 2 });
    const a = await criarClienteTeste(`a-${slug}`);
    const b = await criarClienteTeste(`b-${slug}`);

    const pedido = await pedidos.criarPedido({
      items: [{ productId: produto.slug, variant: produto.variante, quantity: 1 }],
      customer: clientePedido('Proof2'),
      paymentMethod: 'cartao',
      userId: a,
      idempotencyKey: `idem-proof2-${slug}`,
    });
    await pedidos.guardarComprovativo(pedido.reference, 'comprovativos/fake.pdf', {
      userId: a,
      perfil: 'cliente',
    });

    await expect(
      pedidos.chaveComprovativoAutorizado(pedido.reference, { userId: b, perfil: 'cliente' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  }, 30_000);
});
