import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/errors.js';
import {
  assertTransicaoPedido,
  proximosEstados,
  transicaoPermitida,
} from '../services/transicoesPedido.js';

describe('transicoesPedido', () => {
  it('permite o fluxo feliz', () => {
    expect(transicaoPermitida('pendente', 'pago')).toBe(true);
    expect(transicaoPermitida('pago', 'em_preparacao')).toBe(true);
    expect(transicaoPermitida('em_preparacao', 'enviado')).toBe(true);
    expect(transicaoPermitida('enviado', 'entregue')).toBe(true);
  });

  it('bloqueia regressões e saltos', () => {
    expect(transicaoPermitida('entregue', 'pendente')).toBe(false);
    expect(transicaoPermitida('entregue', 'pago')).toBe(false);
    expect(transicaoPermitida('pago', 'enviado')).toBe(false);
    expect(transicaoPermitida('pendente', 'entregue')).toBe(false);
    expect(transicaoPermitida('cancelado', 'pago')).toBe(false);
  });

  it('permite cancelar até ao envio, não após entrega', () => {
    expect(transicaoPermitida('pendente', 'cancelado')).toBe(true);
    expect(transicaoPermitida('pago', 'cancelado')).toBe(true);
    expect(transicaoPermitida('enviado', 'cancelado')).toBe(true);
    expect(transicaoPermitida('entregue', 'cancelado')).toBe(false);
  });

  it('trata o mesmo estado como no-op válido', () => {
    expect(transicaoPermitida('pago', 'pago')).toBe(true);
  });

  it('assertTransicaoPedido lança AppError', () => {
    expect(() => assertTransicaoPedido('entregue', 'pendente')).toThrow(AppError);
  });

  it('proximosEstados lista só transições válidas', () => {
    expect(proximosEstados('pendente')).toEqual(['pago', 'cancelado']);
    expect(proximosEstados('entregue')).toEqual([]);
  });
});
