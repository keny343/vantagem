import { describe, expect, it } from 'vitest';
import { descontoDeCupao, envioDe, ivaIncluidoDe, LOJA } from './loja.js';
import { detetarMimeImagem, exigirImagemSegura } from '../utils/imagemSegura.js';
import { AppError } from '../utils/errors.js';

describe('descontoDeCupao', () => {
  it('aplica percentual sem ultrapassar o subtotal', () => {
    expect(descontoDeCupao('percentual', 10, 100_000)).toBe(10_000);
    expect(descontoDeCupao('percentual', 100, 50_000)).toBe(50_000);
  });

  it('aplica valor fixo limitado ao subtotal', () => {
    expect(descontoDeCupao('fixo', 5_000, 40_000)).toBe(5_000);
    expect(descontoDeCupao('fixo', 80_000, 40_000)).toBe(40_000);
  });

  it('devolve 0 com subtotal vazio', () => {
    expect(descontoDeCupao('percentual', 10, 0)).toBe(0);
  });
});

describe('envioDe', () => {
  it('é gratuito acima do limiar', () => {
    expect(envioDe(LOJA.envioGratisAPartirCentimos)).toBe(0);
    expect(envioDe(LOJA.envioGratisAPartirCentimos - 1)).toBe(LOJA.custoEnvioCentimos);
  });
});

describe('ivaIncluidoDe', () => {
  it('extrai a parcela de IVA incluído', () => {
    const total = 114_000;
    const iva = ivaIncluidoDe(total);
    expect(iva).toBeGreaterThan(0);
    expect(iva).toBeLessThan(total);
  });
});

describe('imagemSegura', () => {
  it('reconhece JPEG pelos magic bytes', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detetarMimeImagem(jpeg)).toBe('image/jpeg');
    expect(exigirImagemSegura(jpeg, 'image/jpeg')).toBe('image/jpeg');
  });

  it('reconhece PNG', () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(detetarMimeImagem(png)).toBe('image/png');
  });

  it('rejeita conteúdo que não é imagem', () => {
    const txt = Buffer.from('hello world!!!!');
    expect(detetarMimeImagem(txt)).toBeNull();
    expect(() => exigirImagemSegura(txt, 'image/jpeg')).toThrow(AppError);
  });

  it('rejeita MIME declarado falso', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(() => exigirImagemSegura(jpeg, 'image/png')).toThrow(AppError);
  });
});
