import { query } from '../config/database.js';
import type { Perfil } from '../types/domain.js';

export interface UtilizadorRow {
  id: string;
  email: string;
  password_hash: string;
  nome: string;
  perfil: Perfil;
  activo: boolean;
}

export interface SessaoActivaRow {
  id: string;
  utilizador_id: string;
  email: string;
  nome: string;
  perfil: Perfil;
  last_seen_at: Date;
  expires_at: Date;
}

export const encontrarPorEmail = async (email: string): Promise<UtilizadorRow | null> => {
  const { rows } = await query<UtilizadorRow>(
    `SELECT id, email, password_hash, nome, perfil, activo
     FROM utilizadores
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
};

export const falhasRecentes = async (
  email: string,
  ip: string | null,
  minutos: number,
): Promise<{ porEmail: number; porIp: number }> => {
  const { rows: porEmail } = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM tentativas_login
     WHERE lower(email) = lower($1)
       AND succeeded = false
       AND created_at > now() - ($2::text || ' minutes')::interval`,
    [email, String(minutos)],
  );

  let porIpCount = 0;
  if (ip !== null) {
    const { rows: porIp } = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM tentativas_login
       WHERE ip = $1::inet
         AND succeeded = false
         AND created_at > now() - ($2::text || ' minutes')::interval`,
      [ip, String(minutos)],
    );
    porIpCount = Number(porIp[0]?.count ?? 0);
  }

  return {
    porEmail: Number(porEmail[0]?.count ?? 0),
    porIp: porIpCount,
  };
};

export const registarTentativa = async (dados: {
  email: string;
  ip: string | null;
  succeeded: boolean;
}): Promise<void> => {
  await query(
    `INSERT INTO tentativas_login (email, ip, succeeded)
     VALUES ($1, $2::inet, $3)`,
    [dados.email, dados.ip, dados.succeeded],
  );
};

export const criarSessao = async (dados: {
  userId: string;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: Date;
}): Promise<void> => {
  await query(
    `INSERT INTO sessoes (utilizador_id, token_hash, ip, user_agent, expires_at)
     VALUES ($1, $2, $3::inet, $4, $5)`,
    [dados.userId, dados.tokenHash, dados.ip, dados.userAgent, dados.expiresAt],
  );
};

export const encontrarSessaoActiva = async (tokenHash: string): Promise<SessaoActivaRow | null> => {
  const { rows } = await query<SessaoActivaRow>(
    `SELECT s.id, s.utilizador_id, u.email, u.nome, u.perfil, s.last_seen_at, s.expires_at
     FROM sessoes s
     INNER JOIN utilizadores u ON u.id = s.utilizador_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.activo = true
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
};

export const tocarSessao = async (sessionId: string): Promise<void> => {
  await query(`UPDATE sessoes SET last_seen_at = now() WHERE id = $1`, [sessionId]);
};

export const revogarSessao = async (tokenHash: string): Promise<void> => {
  await query(
    `UPDATE sessoes SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
};

export const criarCliente = async (dados: {
  email: string;
  passwordHash: string;
  nome: string;
  telefone: string | null;
}): Promise<UtilizadorRow> => {
  const { rows } = await query<UtilizadorRow>(
    `INSERT INTO utilizadores (email, password_hash, nome, telefone, perfil)
     VALUES ($1, $2, $3, $4, 'cliente')
     RETURNING id, email, password_hash, nome, perfil, activo`,
    [dados.email, dados.passwordHash, dados.nome, dados.telefone],
  );
  return rows[0]!;
};

export const guardarTokenRecuperacao = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> => {
  await query(
    `UPDATE tokens_recuperacao SET used_at = now()
     WHERE utilizador_id = $1 AND used_at IS NULL`,
    [userId],
  );
  await query(
    `INSERT INTO tokens_recuperacao (utilizador_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
};

export const encontrarTokenRecuperacao = async (
  tokenHash: string,
): Promise<{ id: string; utilizador_id: string } | null> => {
  const { rows } = await query<{ id: string; utilizador_id: string }>(
    `SELECT id, utilizador_id FROM tokens_recuperacao
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
};

export const gastarTokenRecuperacao = async (id: string): Promise<void> => {
  await query(`UPDATE tokens_recuperacao SET used_at = now() WHERE id = $1`, [id]);
};

export const actualizarPassword = async (userId: string, passwordHash: string): Promise<void> => {
  await query(
    `UPDATE utilizadores SET password_hash = $1, updated_at = now() WHERE id = $2`,
    [passwordHash, userId],
  );
};

export const obterUtilizador = async (
  id: string,
): Promise<{
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  perfil: Perfil;
  morada: string | null;
  codigo_postal: string | null;
  cidade: string | null;
} | null> => {
  const { rows } = await query<{
    id: string;
    email: string;
    nome: string;
    telefone: string | null;
    perfil: Perfil;
    morada: string | null;
    codigo_postal: string | null;
    cidade: string | null;
  }>(
    `SELECT id, email, nome, telefone, perfil, morada, codigo_postal, cidade
     FROM utilizadores WHERE id = $1 AND activo = true LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
};
