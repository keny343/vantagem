import { query } from '../config/database.js';
import type { ProdutoPublico } from '../types/domain.js';
import { mapearProduto, type ProdutoRow } from './produtos.repository.js';

export interface Favorito {
  id: string;
  utilizador_id: string;
  produto_id: string;
  created_at: string;
}

export const listarFavoritos = async (utilizadorId: string): Promise<ProdutoPublico[]> => {
  const { rows } = await query<ProdutoRow>(
    `SELECT
      p.id, p.slug, p.sku, p.nome, p.marca,
      c.nome AS categoria, c.slug AS categoria_slug,
      p.preco_centimos, p.preco_antigo_centimos,
      s.quantidade AS stock,
      p.specs, p.variante_label, p.variante_opcoes, p.imagens,
      p.descricao, p.badge, p.featured, p.hero, p.vendidos, p.garantia_meses
    FROM favoritos f
    INNER JOIN produtos p ON p.id = f.produto_id
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN stock s ON s.produto_id = p.id
    WHERE f.utilizador_id = $1 AND p.activo = true
    ORDER BY f.created_at DESC`,
    [utilizadorId],
  );
  return rows.map(mapearProduto);
};

export const adicionarFavorito = async (
  utilizadorId: string,
  slug: string,
): Promise<void> => {
  const { rows } = await query<{ id: string }>(`SELECT id FROM produtos WHERE slug = $1 LIMIT 1`, [
    slug,
  ]);
  const produto = rows[0];
  if (produto === undefined) {
    const { notFound } = await import('../utils/errors.js');
    throw notFound('Produto');
  }
  await query(
    `INSERT INTO favoritos (utilizador_id, produto_id)
     VALUES ($1, $2)
     ON CONFLICT (utilizador_id, produto_id) DO NOTHING`,
    [utilizadorId, produto.id],
  );
};

export const removerFavorito = async (utilizadorId: string, slug: string): Promise<boolean> => {
  const { rowCount } = await query(
    `DELETE FROM favoritos f
     USING produtos p
     WHERE f.produto_id = p.id AND f.utilizador_id = $1 AND p.slug = $2`,
    [utilizadorId, slug],
  );
  return (rowCount ?? 0) > 0;
};

export const verificarFavorito = async (utilizadorId: string, slug: string): Promise<boolean> => {
  const { rows } = await query<{ existe: boolean }>(
    `SELECT EXISTS(
      SELECT 1 FROM favoritos f
      INNER JOIN produtos p ON p.id = f.produto_id
      WHERE f.utilizador_id = $1 AND p.slug = $2
    ) AS existe`,
    [utilizadorId, slug],
  );
  return rows[0]?.existe ?? false;
};
