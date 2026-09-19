/** Espelha backend/src/config/loja.ts — totais definitivos vêm sempre do servidor. */

export const LOJA = {
  nome: 'Vantagem',
  nomeLegal: 'Vantagem Electrónica, Lda.',
  nif: '5000000000',
  morada: 'Rua Rainha Ginga, Ingombota, Luanda',
  email: 'encomendas@vantagem.ao',
  telefone: '+244 923 000 000',
  envioGratisAPartir: 50_000,
  custoEnvio: 2_500,
  taxaIva: 0.14,
  diasDevolucao: 14,
  garantiaMesesPadrao: 12,
  pais: 'Angola',
} as const;

export const envioDe = (subtotal: number): number => {
  if (subtotal === 0 || subtotal >= LOJA.envioGratisAPartir) return 0;
  return LOJA.custoEnvio;
};

export const ivaIncluidoDe = (total: number): number => total - total / (1 + LOJA.taxaIva);

export const faltaParaEnvioGratis = (subtotal: number): number =>
  Math.max(0, LOJA.envioGratisAPartir - subtotal);
