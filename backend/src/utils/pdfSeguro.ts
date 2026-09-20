import { AppError } from '../utils/errors.js';

/** Limites práticos para comprovativos bancários em PDF. */
export const PDF_MIN_BYTES = 512;
export const PDF_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Tokens típicos de PDF com scripts, lançadores ou anexos embutidos.
 * Comprovativos bancários legítimos não precisam disto — rejeitamos para
 * reduzir polyglots e PDFs adulterados usados em burla.
 */
const PERIGOSOS = [
  /\/JavaScript\b/i,
  /\/JS\b/,
  /\/Launch\b/i,
  /\/EmbeddedFile\b/i,
  /\/RichMedia\b/i,
  /\/AA\b/,
  /\/OpenAction\b/i,
  /\/SubmitForm\b/i,
  /\/ImportData\b/i,
  /\/XFA\b/i,
];

const cabecalhoPdf = (buffer: Buffer): boolean => {
  if (buffer.length < 8) return false;
  // BOM UTF-8 ocasional antes do %PDF
  let offset = 0;
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) offset = 3;
  return buffer.subarray(offset, offset + 5).toString('latin1') === '%PDF-';
};

const temEof = (buffer: Buffer): boolean => {
  const cauda = buffer.subarray(Math.max(0, buffer.length - 1024)).toString('latin1');
  return /%%EOF\s*$/.test(cauda) || cauda.includes('%%EOF');
};

const pareceImagem = (buffer: Buffer): boolean => {
  if (buffer.length < 4) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF') return true;
  return false;
};

/**
 * Valida PDF de comprovativo: magic bytes, tamanho, estrutura básica e
 * ausência de funcionalidades típicas de adulteração / malware.
 * Não valida assinatura digital do banco (isso exige PKI do emitente).
 */
export const exigirPdfComprovativo = (buffer: Buffer, mimeDeclarado: string): 'application/pdf' => {
  if (buffer.length < PDF_MIN_BYTES) {
    throw new AppError(
      'VALIDATION_ERROR',
      `O PDF é demasiado pequeno (mínimo ${PDF_MIN_BYTES} bytes). Envia o comprovativo completo do banco.`,
    );
  }
  if (buffer.length > PDF_MAX_BYTES) {
    throw new AppError(
      'VALIDATION_ERROR',
      'O PDF não pode ter mais de 5 MB.',
    );
  }

  const declarado = mimeDeclarado.toLowerCase().trim();
  if (declarado && declarado !== 'application/pdf' && declarado !== 'application/x-pdf') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Só são aceites comprovativos em PDF. O tipo declarado não é PDF.',
    );
  }

  if (pareceImagem(buffer) || !cabecalhoPdf(buffer)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'O ficheiro não é um PDF válido. Não envies fotografias renomeadas — exporta o comprovativo em PDF no banco ou Multicaixa.',
    );
  }

  if (!temEof(buffer)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'O PDF parece incompleto ou adulterado (falta o fecho %%EOF). Volta a descarregar o comprovativo no banco.',
    );
  }

  // Amostra o início + meio + fim para detectar payloads escondidos sem varrer PDFs enormes byte a byte.
  const amostra = Buffer.concat([
    buffer.subarray(0, Math.min(buffer.length, 64 * 1024)),
    buffer.length > 128 * 1024
      ? buffer.subarray(Math.floor(buffer.length / 2) - 32 * 1024, Math.floor(buffer.length / 2) + 32 * 1024)
      : Buffer.alloc(0),
    buffer.subarray(Math.max(0, buffer.length - 64 * 1024)),
  ]).toString('latin1');

  for (const padrao of PERIGOSOS) {
    if (padrao.test(amostra)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Este PDF tem funcionalidades suspeitas (scripts ou anexos). Envia o PDF original do banco, sem edições.',
      );
    }
  }

  if (/\/Encrypt\b/.test(amostra)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Não aceitamos PDF protegido por palavra-passe. Exporta o comprovativo sem proteção.',
    );
  }

  // Versão PDF razoável (%PDF-1.x ou 2.x)
  const versao = buffer.toString('latin1', 0, 16).match(/%PDF-(\d+)\.(\d+)/);
  if (!versao) {
    throw new AppError('VALIDATION_ERROR', 'Cabeçalho PDF inválido.');
  }
  const major = Number(versao[1]);
  if (major < 1 || major > 2) {
    throw new AppError('VALIDATION_ERROR', 'Versão de PDF não suportada.');
  }

  return 'application/pdf';
};
