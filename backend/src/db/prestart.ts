import { migrate } from './db/migrate.js';
import { closePool } from './config/database.js';
import { logger } from './utils/logger.js';

try {
  const { aplicadas } = await migrate();
  logger.info('prestart migrations done', { count: aplicadas.length });
} catch (erro) {
  logger.error('prestart migration failed', {
    message: erro instanceof Error ? erro.message : String(erro),
  });
  process.exitCode = 1;
} finally {
  await closePool();
}
