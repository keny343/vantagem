import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/** Aiven/Render put sslmode in the URI; Node pg then verifies the CA and fails. */
const connectionString = (() => {
  try {
    const uri = new URL(env.DATABASE_URL);
    uri.searchParams.delete('sslmode');
    return uri.toString();
  } catch {
    return env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, '');
  }
})();

export const pool = new pg.Pool({
  connectionString,
  ...(env.DATABASE_SSL ? { ssl: { rejectUnauthorized: false } } : {}),
  max: env.isTest ? 4 : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: 'vantagem-api',
});

pool.on('error', (erro) => {
  logger.error('idle postgres client failed', { message: erro.message });
});

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export const query = async <T extends pg.QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> => {
  const resultado = await pool.query<T>(sql, params as unknown[]);
  return { rows: resultado.rows, rowCount: resultado.rowCount ?? 0 };
};

export const transaction = async <T>(
  trabalho: (client: pg.PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await trabalho(client);
    await client.query('COMMIT');
    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
};
