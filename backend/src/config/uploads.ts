import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const PASTA_UPLOADS = path.join(raiz, 'uploads');
export const PASTA_FOTOS_PRODUTO = path.join(PASTA_UPLOADS, 'produtos');

export const garantirPastasUpload = (): void => {
  mkdirSync(PASTA_FOTOS_PRODUTO, { recursive: true });
};
