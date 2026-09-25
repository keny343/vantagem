import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import {
  PASTA_COMPROVATIVOS,
  PASTA_FOTOS_PRODUTO,
  garantirPastasUpload,
} from '../config/uploads.js';
import { AppError } from '../utils/errors.js';

const PASTAS_PRIVADAS = new Set(['comprovativos']);

const extensaoDe = (mimetype: string, original: string): string => {
  const doNome = path.extname(original).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'].includes(doNome)) return doNome;
  if (mimetype === 'application/pdf') return '.pdf';
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  if (mimetype === 'image/gif') return '.gif';
  return '.jpg';
};

const supabaseActivo = (): boolean =>
  Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

const sanitizarPasta = (pasta: string): string => pasta.replace(/[^a-z0-9_-]/gi, '');

const bucketPublico = (): string => env.SUPABASE_STORAGE_BUCKET || 'artigos';
const bucketComprovativos = (): string =>
  env.SUPABASE_STORAGE_BUCKET_COMPROVATIVOS || 'comprovativos';

/** Extrai a chave de objecto a partir de URLs legadas ou chaves já normalizadas. */
export const chaveDeArmazenamento = (valor: string): string => {
  const v = valor.trim();
  if (!v) {
    throw new AppError('NOT_FOUND', 'Ficheiro não encontrado.');
  }
  if (!/^https?:\/\//i.test(v) && !v.startsWith('/')) {
    return v.replace(/^\/+/, '');
  }
  const publico = v.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+?)(?:\?|$)/i);
  if (publico?.[1]) return decodeURIComponent(publico[1]);
  const autenticado = v.match(/\/storage\/v1\/object\/(?:authenticated\/)?[^/]+\/(.+?)(?:\?|$)/i);
  if (autenticado?.[1]) return decodeURIComponent(autenticado[1]);
  const local = v.match(/\/uploads\/((?:comprovativos|produtos)\/[^/?#]+)/i);
  if (local?.[1]) return local[1];
  throw new AppError('NOT_FOUND', 'Ficheiro não encontrado.');
};

const guardarNoSupabase = async (
  ficheiro: { buffer: Buffer; mimetype: string },
  bucket: string,
  objectKey: string,
): Promise<void> => {
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const endpoint = `${base}/storage/v1/object/${bucket}/${objectKey}`;
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
};

const lerDoSupabase = async (bucket: string, objectKey: string): Promise<Buffer | null> => {
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const endpoint = `${base}/storage/v1/object/${bucket}/${objectKey}`;
  const resposta = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!resposta.ok) return null;
  return Buffer.from(await resposta.arrayBuffer());
};

const pastaLocalDe = (chave: string): string => {
  if (chave.startsWith('comprovativos/')) return PASTA_COMPROVATIVOS;
  return PASTA_FOTOS_PRODUTO;
};

/**
 * Grava ficheiro.
 * Comprovativos → bucket privado `comprovativos` (chave lógica `comprovativos/…`).
 * Produtos → bucket público `artigos` com URL pública.
 */
export const guardarFicheiro = async (
  ficheiro: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  },
  pasta = 'produtos',
): Promise<string> => {
  const pastaLimpa = sanitizarPasta(pasta) || 'produtos';
  const privada = PASTAS_PRIVADAS.has(pastaLimpa);
  const ext = extensaoDe(ficheiro.mimetype, ficheiro.originalname);
  const nome = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
  const chaveLogica = `${pastaLimpa}/${nome}`;

  if (supabaseActivo()) {
    if (privada) {
      // Object key no bucket privado = só o ficheiro (bucket já é "comprovativos").
      await guardarNoSupabase(ficheiro, bucketComprovativos(), nome);
      return chaveLogica;
    }
    await guardarNoSupabase(ficheiro, bucketPublico(), chaveLogica);
    const base = env.SUPABASE_URL.replace(/\/+$/, '');
    return `${base}/storage/v1/object/public/${bucketPublico()}/${chaveLogica}`;
  }

  if (env.isProduction) {
    throw new AppError(
      'INTERNAL_ERROR',
      'Armazenamento remoto não está configurado. Define SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  garantirPastasUpload();
  const destino = path.join(pastaLocalDe(chaveLogica), nome);
  await writeFile(destino, ficheiro.buffer);
  if (privada) return chaveLogica;
  return `/uploads/produtos/${nome}`;
};

/** Lê bytes de um objecto privado (dono/admin já validados pelo caller). */
export const lerFicheiroPrivado = async (valorArmazenado: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
}> => {
  const chave = chaveDeArmazenamento(valorArmazenado);
  if (!chave.startsWith('comprovativos/') && !chave.startsWith('produtos/')) {
    throw new AppError('NOT_FOUND', 'Ficheiro não encontrado.');
  }

  let buffer: Buffer | null = null;
  if (supabaseActivo()) {
    if (chave.startsWith('comprovativos/')) {
      const nome = path.basename(chave);
      // 1) bucket privado novo
      buffer = await lerDoSupabase(bucketComprovativos(), nome);
      // 2) legado: pasta comprovativos/ no bucket artigos
      if (buffer === null) {
        buffer = await lerDoSupabase(bucketPublico(), chave);
      }
      // 3) legado: object key sem prefixo no bucket artigos
      if (buffer === null) {
        buffer = await lerDoSupabase(bucketPublico(), nome);
      }
    } else {
      buffer = await lerDoSupabase(bucketPublico(), chave);
    }
    if (buffer === null) {
      throw new AppError('NOT_FOUND', 'Ficheiro não encontrado.');
    }
  } else {
    buffer = await readFile(path.join(pastaLocalDe(chave), path.basename(chave)));
  }

  const ext = path.extname(chave).toLowerCase();
  const contentType =
    ext === '.pdf'
      ? 'application/pdf'
      : ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'application/octet-stream';

  return { buffer, contentType, filename: path.basename(chave) };
};
