import type { EstadoPedido } from '../types/domain.js';
import { AppError } from '../utils/errors.js';

/**
 * Fluxo operacional da loja (transferência + confirmação humana):
 * pendente → pago → em_preparacao → enviado → entregue
 * Cancelamento permitido até ao envio (não após entregue).
 */
const PERMITIDAS: Readonly<Record<EstadoPedido, readonly EstadoPedido[]>> = {
  pendente: ['pago', 'cancelado'],
  pago: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

export const transicaoPermitida = (de: EstadoPedido, para: EstadoPedido): boolean => {
  if (de === para) return true;
  return PERMITIDAS[de].includes(para);
};

export const assertTransicaoPedido = (de: EstadoPedido, para: EstadoPedido): void => {
  if (transicaoPermitida(de, para)) return;
  throw new AppError(
    'VALIDATION_ERROR',
    `Não é permitido passar o pedido de «${de}» para «${para}».`,
  );
};

export const proximosEstados = (actual: EstadoPedido): readonly EstadoPedido[] =>
  PERMITIDAS[actual];
