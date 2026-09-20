import { closePool, query } from '../../src/config/database.js';
import { migrate } from '../../src/db/migrate.js';

let preparado = false;

export const postgresDisponivel = async (): Promise<boolean> => {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

export const prepararBaseTeste = async (): Promise<void> => {
  if (preparado) return;
  await migrate();
  preparado = true;
};

export const limparPedidosEStock = async (): Promise<void> => {
  await query('DELETE FROM itens_de_pedido');
  await query('DELETE FROM cupons_utilizador');
  await query('DELETE FROM pedidos');
  await query('DELETE FROM stock');
  await query('DELETE FROM produtos');
  await query(`DELETE FROM categorias WHERE slug LIKE 'test-%'`);
  await query(`DELETE FROM utilizadores WHERE email LIKE 'test-%@vantagem.test'`);
};

export const fecharBaseTeste = async (): Promise<void> => {
  await closePool();
};

export const criarProdutoComStock = async (dados: {
  slug: string;
  stock: number;
  precoCentimos?: number;
  variante?: string;
}): Promise<{ produtoId: string; slug: string; variante: string }> => {
  const variante = dados.variante ?? 'Único';
  const { rows: cats } = await query<{ id: string }>(
    `INSERT INTO categorias (slug, nome, ordem)
     VALUES ($1, $2, 0)
     ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
     RETURNING id`,
    [`test-${dados.slug}`, `Teste ${dados.slug}`],
  );
  const categoriaId = cats[0]?.id;
  if (categoriaId === undefined) throw new Error('categoria de teste em falta');

  const { rows: prods } = await query<{ id: string }>(
    `INSERT INTO produtos (
       slug, sku, nome, marca, categoria_id, preco_centimos, descricao,
       variante_label, variante_opcoes, specs, imagens, activo
     ) VALUES (
       $1, $2, $3, 'Teste', $4, $5, 'Produto de integração',
       'Opção', $6::jsonb, '[]'::jsonb, '[]'::jsonb, true
     )
     RETURNING id`,
    [
      dados.slug,
      `SKU-${dados.slug}`,
      `Artigo ${dados.slug}`,
      categoriaId,
      dados.precoCentimos ?? 250_000,
      JSON.stringify([variante]),
    ],
  );
  const produtoId = prods[0]?.id;
  if (produtoId === undefined) throw new Error('produto de teste em falta');

  await query(`INSERT INTO stock (produto_id, quantidade) VALUES ($1, $2)`, [
    produtoId,
    dados.stock,
  ]);

  return { produtoId, slug: dados.slug, variante };
};

export const criarClienteTeste = async (sufixo: string): Promise<string> => {
  const email = `test-${sufixo}@vantagem.test`;
  const { rows } = await query<{ id: string }>(
    `INSERT INTO utilizadores (email, password_hash, nome, perfil)
     VALUES ($1, 'x', $2, 'cliente')
     ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
     RETURNING id`,
    [email, `Cliente ${sufixo}`],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error('cliente de teste em falta');
  return id;
};

export const stockDe = async (produtoId: string): Promise<number> => {
  const { rows } = await query<{ quantidade: number }>(
    `SELECT quantidade FROM stock WHERE produto_id = $1`,
    [produtoId],
  );
  return rows[0]?.quantidade ?? -1;
};
