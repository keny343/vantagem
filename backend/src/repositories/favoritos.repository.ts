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
      p.descricao, p.badge, p.featured, p.vendidos
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
  produtoId: string,
): Promise<void> => {
  await query(
    `INSERT INTO favoritos (utilizador_id, produto_id)
     VALUES ($1, $2)
     ON CONFLICT (utilizador_id, produto_id) DO NOTHING`,
    [utilizadorId, produtoId],
  );
};

export const removerFavorito = async (
  utilizadorId: string,
  produtoId: string,
): Promise<boolean> => {
  const { rowCount } = await query(
    `DELETE FROM favoritos WHERE utilizador_id = $1 AND produto_id = $2`,
    [utilizadorId, produtoId],
  );
  return (rowCount ?? 0) > 0;
};

export const verificarFavorito = async (
  utilizadorId: string,
  produtoId: string,
): Promise<boolean> => {
  const { rows } = await query<{ existe: boolean }>(
    `SELECT EXISTS(
      SELECT 1 FROM favoritos WHERE utilizador_id = $1 AND produto_id = $2
    ) AS existe`,
    [utilizadorId, produtoId],
  );
  return rows[0]?.existe ?? false;
};
