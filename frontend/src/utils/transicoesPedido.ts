/** Próximos estados válidos (espelha backend/src/services/transicoesPedido.ts). */
const PERMITIDAS: Record<string, readonly string[]> = {
  pendente: ['pago', 'cancelado'],
  pago: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

export function proximosEstadosPedido(actual: string): string[] {
  return [...(PERMITIDAS[actual] ?? [])];
}

/** Opções do select: estado actual + próximos permitidos. */
export function opcoesEstadoPedido(actual: string): string[] {
  const proximos = proximosEstadosPedido(actual);
  return [actual, ...proximos.filter((e) => e !== actual)];
}
