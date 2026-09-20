/**
 * Catálogo mínimo para E2E — um artigo featured com stock.
 * Uso: NODE_ENV=development DATABASE_URL=... node scripts/seed-e2e.mjs
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL em falta');
  process.exit(1);
}

const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@e2e.vantagem.test').toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD ?? 'E2eAdminPass99';

const pool = new pg.Pool({ connectionString: url });

try {
  await pool.query(`
    INSERT INTO categorias (slug, nome, ordem)
    VALUES ('e2e', 'E2E', 0)
    ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
  `);

  const { rows: cats } = await pool.query(
    `SELECT id FROM categorias WHERE slug = 'e2e' LIMIT 1`,
  );
  const categoriaId = cats[0]?.id;
  if (!categoriaId) throw new Error('categoria e2e');

  const { rows: prods } = await pool.query(
    `INSERT INTO produtos (
       slug, sku, nome, marca, categoria_id,
       preco_centimos, descricao, badge, featured, hero, vendidos,
       variante_label, variante_opcoes, specs, imagens, activo
     ) VALUES (
       'e2e-cabo-usb', 'E2E-USB', 'Cabo USB-C E2E', 'Vantagem', $1,
       250000, 'Artigo de teste E2E', 'Teste', true, true, 0,
       'Cor', $2::jsonb, $3::jsonb, $4::jsonb, true
     )
     ON CONFLICT (slug) DO UPDATE SET
       preco_centimos = EXCLUDED.preco_centimos,
       featured = true,
       hero = true,
       activo = true,
       variante_opcoes = EXCLUDED.variante_opcoes
     RETURNING id`,
    [categoriaId, JSON.stringify(['Preto']), JSON.stringify(['1 m']), JSON.stringify([])],
  );
  const produtoId = prods[0]?.id;
  if (!produtoId) throw new Error('produto e2e');

  await pool.query(
    `INSERT INTO stock (produto_id, quantidade) VALUES ($1, 20)
     ON CONFLICT (produto_id) DO UPDATE SET quantidade = 20, actualizado_em = now()`,
    [produtoId],
  );

  const hash = await bcrypt.hash(adminPass, 10);
  await pool.query(
    `INSERT INTO utilizadores (email, password_hash, nome, perfil, cidade)
     VALUES ($1, $2, 'Admin E2E', 'admin', 'Luanda')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, perfil = 'admin'`,
    [adminEmail, hash],
  );

  console.log(JSON.stringify({ ok: true, product: 'e2e-cabo-usb', admin: adminEmail }));
} catch (erro) {
  console.error(erro);
  process.exitCode = 1;
} finally {
  await pool.end();
}
