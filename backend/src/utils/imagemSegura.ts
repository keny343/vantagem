import { AppError } from '../utils/errors.js';

/** Assinaturas reais do ficheiro — não confiar só no Content-Type do browser. */
export const detetarMimeImagem = (buffer: Buffer): string | null => {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39)
  ) {
    return 'image/gif';
  }
  // RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
};

export const exigirImagemSegura = (buffer: Buffer, mimeDeclarado: string): string => {
  const real = detetarMimeImagem(buffer);
  if (real === null) {
    throw new AppError(
      'VALIDATION_ERROR',
      'O ficheiro não é uma fotografia válida (JPG, PNG, WEBP ou GIF).',
    );
  }
  const declarado = mimeDeclarado.toLowerCase();
  if (declarado !== real && !(declarado === 'image/jpg' && real === 'image/jpeg')) {
    throw new AppError(
      'VALIDATION_ERROR',
      'O tipo declarado do ficheiro não corresponde ao conteúdo. Envia uma fotografia normal.',
    );
  }
  return real;
};
