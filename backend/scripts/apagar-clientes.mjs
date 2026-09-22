/**
 * Apaga TODOS os utilizadores com perfil "cliente".
 * Mantém contas admin. Pedidos ficam com utilizador_id = NULL (ON DELETE SET NULL).
 *
 * Uso (produção ou local):
 *   CONFIRM=APAGAR_CLIENTES DATABASE_URL=... node scripts/apagar-clientes.mjs
 *
 * Ou com .env do backend:
 *   CONFIRM=APAGAR_CLIENTES node --env-file=.env scripts/apagar-clientes.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadDotEnv() {
  if (process.env.DATABASE_URL) return;
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL em falta');
  process.exit(1);
}

if (process.env.CONFIRM !== 'APAGAR_CLIENTES') {
  console.error(
    'Abortado. Para confirmar, defina CONFIRM=APAGAR_CLIENTES\n' +
      'Exemplo: CONFIRM=APAGAR_CLIENTES node scripts/apagar-clientes.mjs',
  );
  process.exit(1);
}

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const pool = new pg.Pool({ connectionString: url });

try {
  const { rows: before } = await pool.query(
    `SELECT id, email, nome, perfil
     FROM utilizadores
     WHERE perfil = 'cliente'
     ORDER BY created_at`,
  );

  console.log(`Clientes encontrados: ${before.length}`);
  for (const u of before) {
    console.log(`  - ${u.email} (${u.nome || 'sem nome'}) [${u.id}]`);
  }

  if (before.length === 0) {
    console.log('Nada a apagar.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('DRY_RUN=1 — nenhum registo foi apagado.');
    process.exit(0);
  }

  await pool.query('BEGIN');

  // Limpar referências que possam bloquear (mensagens / tickets com admin ↔ cliente já CASCADE)
  const { rowCount } = await pool.query(
    `DELETE FROM utilizadores WHERE perfil = 'cliente'`,
  );

  await pool.query('COMMIT');

  const { rows: admins } = await pool.query(
    `SELECT count(*)::int AS n FROM utilizadores WHERE perfil = 'admin'`,
  );

  console.log(`Apagados: ${rowCount} cliente(s).`);
  console.log(`Admins restantes: ${admins[0]?.n ?? 0}`);
  console.log('Pedidos associados ficam sem dono (utilizador_id NULL).');
} catch (err) {
  try {
    await pool.query('ROLLBACK');
  } catch {
    /* ignore */
  }
  console.error('Erro:', err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await pool.end();
}
