import { query } from '../config/database.js';
import { eurosDeCentimos, type ProdutoPublico } from '../types/domain.js';

export interface ProdutoRow {
  id: string;
  slug: string;
  sku: string;
  nome: string;
  marca: string;
  categoria: string;
  categoria_slug: string;
  preco_centimos: number;
  preco_antigo_centimos: number | null;
  stock: number;
  specs: string[] | string;
  variante_label: string;
  variante_opcoes: string[] | string;
  imagens: string[] | string;
  descricao: string;
  badge: string | null;
  featured: boolean;
  hero: boolean;
  vendidos: number;
  garantia_meses: number | null;
}

const asStringArray = (valor: string[] | string): string[] => {
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor === 'string') {
    try {
      const parsed: unknown = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const mapearProduto = (row: ProdutoRow): ProdutoPublico => ({
  id: row.slug,
  slug: row.slug,
  sku: row.sku,
  name: row.nome,
  brand: row.marca,
  category: row.categoria,
  categorySlug: row.categoria_slug,
  price: eurosDeCentimos(row.preco_centimos),
  oldPrice:
    row.preco_antigo_centimos === null ? null : eurosDeCentimos(row.preco_antigo_centimos),
  stock: row.stock,
  specs: asStringArray(row.specs),
  variants: {
    label: row.variante_label,
    options: asStringArray(row.variante_opcoes),
  },
  images: asStringArray(row.imagens),
  description: row.descricao,
  badge: row.badge,
  featured: row.featured,
  hero: row.hero,
  sold: row.vendidos,
  warrantyMonths: row.garantia_meses,
});

const SELECT_BASE = `
  SELECT
    p.id,
    p.slug,
    p.sku,
    p.nome,
    p.marca,
    c.nome AS categoria,
    c.slug AS categoria_slug,
    p.preco_centimos,
    p.preco_antigo_centimos,
    s.quantidade AS stock,
    p.specs,
    p.variante_label,
    p.variante_opcoes,
    p.imagens,
    p.descricao,
    p.badge,
    p.featured,
    p.hero,
    p.vendidos,
    p.garantia_meses
  FROM produtos p
  INNER JOIN categorias c ON c.id = p.categoria_id
  INNER JOIN stock s ON s.produto_id = p.id
  WHERE p.activo = true
`;

export interface FiltrosCatalogo {
  q?: string;
  categoria?: string;
  marca?: string;
  maxEuros?: number;
  featured?: boolean;
  hero?: boolean;
  sort?: 'relevancia' | 'preco_asc' | 'preco_desc' | 'novos';
}

export const listarCategorias = async (): Promise<{ slug: string; nome: string; ordem: number }[]> => {
  const { rows } = await query<{ slug: string; nome: string; ordem: number }>(
    `SELECT slug, nome, ordem FROM categorias ORDER BY ordem ASC, nome ASC`,
  );
  return rows;
};

export const listarMarcas = async (): Promise<string[]> => {
  const { rows } = await query<{ marca: string }>(
    `SELECT DISTINCT marca FROM produtos WHERE activo = true ORDER BY marca ASC`,
  );
  return rows.map((r) => r.marca);
};

export const listarProdutos = async (filtros: FiltrosCatalogo = {}): Promise<ProdutoPublico[]> => {
  const clausulas: string[] = [];
  const params: unknown[] = [];

  if (filtros.q !== undefined && filtros.q.trim().length > 0) {
    params.push(`%${filtros.q.trim().toLowerCase()}%`);
    clausulas.push(
      `(lower(p.nome) LIKE $${params.length}
        OR lower(p.marca) LIKE $${params.length}
        OR lower(c.nome) LIKE $${params.length}
        OR lower(p.descricao) LIKE $${params.length}
        OR lower(p.specs::text) LIKE $${params.length})`,
    );
  }

  if (filtros.categoria !== undefined && filtros.categoria.length > 0) {
    params.push(filtros.categoria);
    clausulas.push(`(c.nome = $${params.length} OR c.slug = $${params.length})`);
  }

  if (filtros.marca !== undefined && filtros.marca.length > 0) {
    params.push(filtros.marca);
    clausulas.push(`p.marca = $${params.length}`);
  }

  if (filtros.maxEuros !== undefined) {
    params.push(Math.round(filtros.maxEuros * 100));
    clausulas.push(`p.preco_centimos <= $${params.length}`);
  }

  if (filtros.featured === true) {
    clausulas.push(`p.featured = true`);
  }

  if (filtros.hero === true) {
    clausulas.push(`p.hero = true`);
  }

  const whereExtra = clausulas.length > 0 ? ` AND ${clausulas.join(' AND ')}` : '';
  const ordem =
    filtros.sort === 'preco_asc'
      ? 'p.preco_centimos ASC, p.nome ASC'
      : filtros.sort === 'preco_desc'
        ? 'p.preco_centimos DESC, p.nome ASC'
        : filtros.sort === 'novos'
          ? 'p.created_at DESC'
          : 'p.hero DESC, p.featured DESC, p.vendidos DESC, p.nome ASC';
  const { rows } = await query<ProdutoRow>(
    `${SELECT_BASE}${whereExtra} ORDER BY ${ordem}`,
    params,
  );
  return rows.map(mapearProduto);
};

export const obterPorSlug = async (slug: string): Promise<ProdutoPublico | null> => {
  const { rows } = await query<ProdutoRow>(`${SELECT_BASE} AND p.slug = $1 LIMIT 1`, [slug]);
  const row = rows[0];
  return row === undefined ? null : mapearProduto(row);
};

export const relacionados = async (
  slug: string,
  categoria: string,
  limite = 4,
): Promise<ProdutoPublico[]> => {
  const { rows } = await query<ProdutoRow>(
    `${SELECT_BASE}
      AND c.nome = $1
      AND p.slug <> $2
     ORDER BY p.hero DESC, p.featured DESC, p.vendidos DESC
     LIMIT $3`,
    [categoria, slug, limite],
  );
  return rows.map(mapearProduto);
};
