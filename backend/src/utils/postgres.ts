export const slugify = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const isUniqueViolation = (erro: unknown): boolean =>
  typeof erro === 'object' && erro !== null && 'code' in erro && (erro as { code: string }).code === '23505';

export const isForeignKeyViolation = (erro: unknown): boolean =>
  typeof erro === 'object' && erro !== null && 'code' in erro && (erro as { code: string }).code === '23503';
