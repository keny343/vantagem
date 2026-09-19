import { env } from './env.js';

/** Loja em Angola. Preços ao público incluem IVA (14%). Unidade na API = Kwanza. */

export const LOJA = {
  nome: 'Vantagem',
  nomeLegal: env.LOJA_NOME_LEGAL || 'Vantagem Electrónica, Lda.',
  nif: env.LOJA_NIF || '5000000000',
  morada: env.LOJA_MORADA || 'Rua Rainha Ginga, Ingombota, Luanda',
  email: env.LOJA_EMAIL || 'encomendas@vantagem.ao',
  telefone: env.LOJA_TELEFONE || '+244 923 000 000',
  iban: env.LOJA_IBAN,
  envioGratisAPartirCentimos: 5_000_000,
  custoEnvioCentimos: 250_000,
  taxaIva: 0.14,
  diasDevolucao: 14,
  garantiaMesesPadrao: 12,
  mbEntidade: '10459',
  pais: 'Angola',
  pagamentoModo: env.PAGAMENTO_MODO,
} as const;

export const envioDe = (subtotalCentimos: number): number => {
  if (subtotalCentimos === 0 || subtotalCentimos >= LOJA.envioGratisAPartirCentimos) return 0;
  return LOJA.custoEnvioCentimos;
};

export const descontoDeCupao = (
  tipo: 'percentual' | 'fixo',
  valor: number,
  subtotalCentimos: number,
): number => {
  if (subtotalCentimos <= 0) return 0;
  if (tipo === 'percentual') {
    return Math.min(subtotalCentimos, Math.round((subtotalCentimos * valor) / 100));
  }
  return Math.min(subtotalCentimos, valor);
};

/** Parcela de IVA já incluída no total com imposto. */
export const ivaIncluidoDe = (totalCentimos: number): number =>
  totalCentimos - Math.round(totalCentimos / (1 + LOJA.taxaIva));
