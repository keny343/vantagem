import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { PASTA_FOTOS_PRODUTO, garantirPastasUpload } from '../config/uploads.js';
import { AppError } from '../utils/errors.js';

const extensaoDe = (mimetype: string, original: string): string => {
  const doNome = path.extname(original).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(doNome)) return doNome;
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  if (mimetype === 'image/gif') return '.gif';
  return '.jpg';
};

const supabaseActivo = (): boolean =>
  Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

const guardarNoSupabase = async (
  ficheiro: { buffer: Buffer; mimetype: string },
  chave: string,
): Promise<string> => {
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const bucket = env.SUPABASE_STORAGE_BUCKET;
  const endpoint = `${base}/storage/v1/object/${bucket}/${chave}`;
  const resposta = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': ficheiro.mimetype,
      'x-upsert': 'true',
    },
    body: new Uint8Array(ficheiro.buffer),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new AppError(
      'INTERNAL_ERROR',
      `Não foi possível gravar o ficheiro no Supabase (${resposta.status}).`,
      { cause: detalhe },
    );
  }

  return `${base}/storage/v1/object/public/${bucket}/${chave}`;
};

export const guardarFicheiro = async (
  ficheiro: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  },
  pasta = 'produtos',
): Promise<string> => {
  const ext = extensaoDe(ficheiro.mimetype, ficheiro.originalname);
  const nome = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
  const chave = `${pasta.replace(/[^a-z0-9_-]/gi, '')}/${nome}`;

  if (supabaseActivo()) {
    return guardarNoSupabase(ficheiro, chave);
  }

  if (env.isProduction) {
    throw new AppError(
      'INTERNAL_ERROR',
      'Armazenamento remoto não está configurado. Define SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  garantirPastasUpload();
  await writeFile(path.join(PASTA_FOTOS_PRODUTO, nome), ficheiro.buffer);
  return `/uploads/produtos/${nome}`;
};
