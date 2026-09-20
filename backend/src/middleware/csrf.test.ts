import { createHmac, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { tokensIguais } from '../services/auth.service.js';

/** Espelha a lógica de assinatura CSRF sem depender do env de produção. */
const assinar = (nonce: string, segredo: string): string => {
  const sig = createHmac('sha256', segredo).update(nonce).digest('base64url');
  return `${nonce}.${sig}`;
};

const valido = (token: string, segredo: string): boolean => {
  const i = token.lastIndexOf('.');
  if (i <= 0) return false;
  const nonce = token.slice(0, i);
  const sig = token.slice(i + 1);
  const esperado = createHmac('sha256', segredo).update(nonce).digest('base64url');
  return tokensIguais(sig, esperado);
};

describe('CSRF assinado', () => {
  it('aceita token gerado com o mesmo segredo', () => {
    const segredo = 'teste-csrf-segredo';
    const token = assinar(randomBytes(24).toString('base64url'), segredo);
    expect(valido(token, segredo)).toBe(true);
  });

  it('rejeita token com segredo errado', () => {
    const token = assinar(randomBytes(24).toString('base64url'), 'a');
    expect(valido(token, 'b')).toBe(false);
  });

  it('tokensIguais é sensível ao conteúdo', () => {
    expect(tokensIguais('abc', 'abc')).toBe(true);
    expect(tokensIguais('abc', 'abd')).toBe(false);
  });
});
