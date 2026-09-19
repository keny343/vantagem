import { query, transaction } from '../config/database.js';
import { centimosDeEuros, eurosDeCentimos } from '../types/domain.js';
import { AppError, notFound } from '../utils/errors.js';
import { isForeignKeyViolation, isUniqueViolation, slugify } from '../utils/postgres.js';
import { mapearProduto, type ProdutoRow } from '../repositories/produtos.repository.js';

export interface CategoriaAdmin {
  id: string;
  slug: string;
  name: string;
  order: number;
  productCount: number;
}

export interface ProdutoAdmin {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  specs: string[];
  variants: { label: string; options: string[] };
  images: string[];
  description: string;
  badge: string | null;
  featured: boolean;
  hero: boolean;
  sold: number;
  active: boolean;
  warrantyMonths: number | null;
}

const SELECT_ADMIN = `
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
    p.activo,
    p.garantia_meses
  FROM produtos p
  INNER JOIN categorias c ON c.id = p.categoria_id
  INNER JOIN stock s ON s.produto_id = p.id
`;

type ProdutoAdminRow = ProdutoRow & { activo: boolean; garantia_meses: number | null };

const mapearAdmin = (row: ProdutoAdminRow): ProdutoAdmin => ({
  ...mapearProduto(row),
  id: row.id,
  active: row.activo,
  warrantyMonths: row.garantia_meses,
});

export const listarCategoriasAdmin = async (): Promise<CategoriaAdmin[]> => {
  const { rows } = await query<{
    id: string;
    slug: string;
    nome: string;
    ordem: number;
    product_count: string;
  }>(
    `SELECT c.id, c.slug, c.nome, c.ordem,
            count(p.id)::text AS product_count
     FROM categorias c
     LEFT JOIN produtos p ON p.categoria_id = c.id
     GROUP BY c.id
     ORDER BY c.ordem ASC, c.nome ASC`,
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.nome,
    order: r.ordem,
    productCount: Number(r.product_count),
  }));
};

export const criarCategoria = async (input: {
  name: string;
  slug?: string;
  order: number;
}): Promise<CategoriaAdmin> => {
  const slug = input.slug && input.slug.length > 0 ? input.slug : slugify(input.name);
  if (slug.length < 2) {
    throw new AppError('VALIDATION_ERROR', 'Slug da categoria inválido.');
  }
  try {
    const { rows } = await query<{ id: string; slug: string; nome: string; ordem: number }>(
      `INSERT INTO categorias (slug, nome, ordem) VALUES ($1, $2, $3)
       RETURNING id, slug, nome, ordem`,
      [slug, input.name, input.order],
    );
    const row = rows[0];
    if (row === undefined) throw new AppError('INTERNAL_ERROR', 'Categoria sem id.');
    return { id: row.id, slug: row.slug, name: row.nome, order: row.ordem, productCount: 0 };
  } catch (erro) {
    if (isUniqueViolation(erro)) {
      throw new AppError('CONFLICT', 'Já existe uma categoria com esse nome ou slug.');
    }
    throw erro;
  }
};

export const actualizarCategoria = async (
  slugActual: string,
  input: { name?: string; slug?: string; order?: number },
): Promise<CategoriaAdmin> => {
  const actual = await query<{ id: string }>(`SELECT id FROM categorias WHERE slug = $1`, [slugActual]);
  if (actual.rows[0] === undefined) throw notFound('Categoria');

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (input.name !== undefined) {
    campos.push(`nome = $${i++}`);
    valores.push(input.name);
  }
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    if (slug.length < 2) throw new AppError('VALIDATION_ERROR', 'Slug da categoria inválido.');
    campos.push(`slug = $${i++}`);
    valores.push(slug);
  }
  if (input.order !== undefined) {
    campos.push(`ordem = $${i++}`);
    valores.push(input.order);
  }
  if (campos.length === 0) throw new AppError('VALIDATION_ERROR', 'Nenhuma alteração.');

  valores.push(slugActual);
  try {
    await query(
      `UPDATE categorias SET ${campos.join(', ')} WHERE slug = $${i}`,
      valores,
    );
  } catch (erro) {
    if (isUniqueViolation(erro)) {
      throw new AppError('CONFLICT', 'Já existe uma categoria com esse nome ou slug.');
    }
    throw erro;
  }

  const lista = await listarCategoriasAdmin();
  const actualizada = lista.find((c) => c.slug === (input.slug ? slugify(input.slug) : slugActual));
  if (actualizada === undefined) throw notFound('Categoria');
  return actualizada;
};

export const eliminarCategoria = async (slug: string): Promise<void> => {
  try {
    const { rowCount } = await query(`DELETE FROM categorias WHERE slug = $1`, [slug]);
    if (rowCount === 0) throw notFound('Categoria');
  } catch (erro) {
    if (isForeignKeyViolation(erro)) {
      throw new AppError('CONFLICT', 'Não podes eliminar uma categoria com produtos. Move ou desactiva os produtos primeiro.');
    }
    throw erro;
  }
};

export const listarProdutosAdmin = async (): Promise<ProdutoAdmin[]> => {
  const { rows } = await query<ProdutoAdminRow>(
    `${SELECT_ADMIN} ORDER BY p.activo DESC, p.nome ASC`,
  );
  return rows.map(mapearAdmin);
};

export const obterProdutoAdmin = async (slug: string): Promise<ProdutoAdmin> => {
  const { rows } = await query<ProdutoAdminRow>(`${SELECT_ADMIN} WHERE p.slug = $1 LIMIT 1`, [slug]);
  const row = rows[0];
  if (row === undefined) throw notFound('Produto');
  return mapearAdmin(row);
};

export interface DadosProduto {
  name: string;
  brand: string;
  categorySlug: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  description: string;
  specs: string[];
  images: string[];
  variantLabel: string;
  variantOptions: string[];
  badge: string | null;
  featured: boolean;
  hero?: boolean;
  sku?: string;
  slug?: string;
  warrantyMonths: number | null;
  active?: boolean;
}

const resolverCategoriaId = async (slug: string): Promise<string> => {
  const { rows } = await query<{ id: string }>(`SELECT id FROM categorias WHERE slug = $1`, [slug]);
  const id = rows[0]?.id;
  if (id === undefined) throw new AppError('VALIDATION_ERROR', 'Categoria inexistente.');
  return id;
};

const skuAutomatico = (): string => {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `VNT-${n}`;
};

export const criarProduto = async (dados: DadosProduto): Promise<ProdutoAdmin> => {
  const slug = dados.slug && dados.slug.length > 0 ? slugify(dados.slug) : slugify(dados.name);
  if (slug.length < 2) throw new AppError('VALIDATION_ERROR', 'Slug do produto inválido.');
  const sku = dados.sku && dados.sku.trim().length > 0 ? dados.sku.trim().toUpperCase() : skuAutomatico();
  const categoriaId = await resolverCategoriaId(dados.categorySlug);
  const opcoes = dados.variantOptions.length > 0 ? dados.variantOptions : ['Único'];
  const etiqueta = dados.variantLabel.trim().length > 0 ? dados.variantLabel.trim() : 'Opção';
  const hero = dados.hero === true;
  const featured = hero || dados.featured;

  try {
    await transaction(async (client) => {
      if (hero) {
        await client.query(`UPDATE produtos SET hero = false WHERE hero`);
      }
      const inserido = await client.query<{ id: string }>(
        `INSERT INTO produtos (
           slug, sku, nome, marca, categoria_id,
           preco_centimos, preco_antigo_centimos, descricao, badge, featured, hero, vendidos,
           variante_label, variante_opcoes, specs, imagens, activo, garantia_meses, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,
           $6,$7,$8,$9,$10,$11,0,
           $12,$13::jsonb,$14::jsonb,$15::jsonb, true, $16, now()
         ) RETURNING id`,
        [
          slug,
          sku,
          dados.name,
          dados.brand,
          categoriaId,
          centimosDeEuros(dados.price),
          dados.oldPrice === null ? null : centimosDeEuros(dados.oldPrice),
          dados.description,
          dados.badge,
          featured,
          hero,
          etiqueta,
          JSON.stringify(opcoes),
          JSON.stringify(dados.specs),
          JSON.stringify(dados.images),
          dados.warrantyMonths,
        ],
      );
      const produtoId = inserido.rows[0]?.id;
      if (produtoId === undefined) throw new AppError('INTERNAL_ERROR', 'Produto sem id.');
      await client.query(`INSERT INTO stock (produto_id, quantidade) VALUES ($1, $2)`, [
        produtoId,
        dados.stock,
      ]);
    });
  } catch (erro) {
    if (isUniqueViolation(erro)) {
      throw new AppError('CONFLICT', 'Já existe um artigo com esse nome.');
    }
    throw erro;
  }

  return obterProdutoAdmin(slug);
};

export const actualizarProduto = async (slugActual: string, dados: Partial<DadosProduto>): Promise<ProdutoAdmin> => {
  const actual = await obterProdutoAdmin(slugActual);
  const categoriaId =
    dados.categorySlug !== undefined ? await resolverCategoriaId(dados.categorySlug) : undefined;
  const slug =
    dados.slug !== undefined ? slugify(dados.slug) : undefined;

  const campos: string[] = ['updated_at = now()'];
  const valores: unknown[] = [];
  let i = 1;

  const set = (sql: string, valor: unknown) => {
    campos.push(`${sql} $${i++}`);
    valores.push(valor);
  };

  if (dados.name !== undefined) set('nome =', dados.name);
  if (dados.brand !== undefined) set('marca =', dados.brand);
  if (categoriaId !== undefined) set('categoria_id =', categoriaId);
  if (dados.price !== undefined) set('preco_centimos =', centimosDeEuros(dados.price));
  if (dados.oldPrice !== undefined) {
    set('preco_antigo_centimos =', dados.oldPrice === null ? null : centimosDeEuros(dados.oldPrice));
  }
  if (dados.description !== undefined) set('descricao =', dados.description);
  if (dados.badge !== undefined) set('badge =', dados.badge);
  if (dados.featured !== undefined) set('featured =', dados.featured);
  if (dados.hero !== undefined) set('hero =', dados.hero);
  if (dados.variantLabel !== undefined) set('variante_label =', dados.variantLabel);
  if (dados.variantOptions !== undefined) {
    set(
      'variante_opcoes =',
      JSON.stringify(dados.variantOptions.length > 0 ? dados.variantOptions : ['Único']),
    );
  }
  if (dados.specs !== undefined) set('specs =', JSON.stringify(dados.specs));
  if (dados.images !== undefined) set('imagens =', JSON.stringify(dados.images));
  if (dados.warrantyMonths !== undefined) set('garantia_meses =', dados.warrantyMonths);
  if (dados.active !== undefined) set('activo =', dados.active);
  if (dados.sku !== undefined) set('sku =', dados.sku.trim().toUpperCase());
  if (slug !== undefined) {
    if (slug.length < 2) throw new AppError('VALIDATION_ERROR', 'Slug do produto inválido.');
    set('slug =', slug);
  }

  valores.push(slugActual);

  try {
    await transaction(async (client) => {
      if (dados.hero === true) {
        await client.query(`UPDATE produtos SET hero = false WHERE hero AND slug <> $1`, [slugActual]);
        if (dados.featured === undefined) {
          await client.query(`UPDATE produtos SET featured = true WHERE slug = $1`, [slugActual]);
        }
      }
      const result = await client.query(
        `UPDATE produtos SET ${campos.join(', ')} WHERE slug = $${i}`,
        valores,
      );
      if (result.rowCount === 0) throw notFound('Produto');
      if (dados.stock !== undefined) {
        await client.query(
          `UPDATE stock SET quantidade = $1, actualizado_em = now()
           FROM produtos p WHERE stock.produto_id = p.id AND p.slug = $2`,
          [dados.stock, slug ?? slugActual],
        );
      }
    });
  } catch (erro) {
    if (isUniqueViolation(erro)) {
      throw new AppError('CONFLICT', 'Já existe um artigo com esse nome.');
    }
    throw erro;
  }

  return obterProdutoAdmin(slug ?? actual.slug);
};

export const definirHero = async (slug: string | null): Promise<ProdutoAdmin | null> => {
  await transaction(async (client) => {
    await client.query(`UPDATE produtos SET hero = false WHERE hero`);
    if (slug === null || slug.length === 0) return;
    const { rowCount } = await client.query(
      `UPDATE produtos SET hero = true, featured = true, updated_at = now() WHERE slug = $1 AND activo`,
      [slug],
    );
    if (rowCount === 0) throw notFound('Artigo');
  });
  return slug && slug.length > 0 ? obterProdutoAdmin(slug) : null;
};
