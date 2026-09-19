import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const garantirAdminInicial = async (): Promise<void> => {
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if (!email || password.length < 10) return;

  const { rows } = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM utilizadores WHERE perfil = 'admin'`,
  );
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO utilizadores (email, password_hash, nome, perfil, telefone, cidade)
     VALUES ($1, $2, 'Administrador', 'admin', '+244900000000', 'Luanda')
     ON CONFLICT (email) DO NOTHING`,
    [email, hash],
  );
  logger.info('admin inicial criado', { email });
};
