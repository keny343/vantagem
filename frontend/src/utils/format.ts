export const formatPreco = (value: number): string =>
  new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value);

export const formatEuro = formatPreco;

export const ROTULO_PAGAMENTO: Record<string, string> = {
  mbway: 'Multicaixa Express',
  multibanco: 'Referência Multicaixa',
  cartao: 'Transferência bancária',
};

export const ROTULO_ESTADO: Record<string, string> = {
  pendente: 'Aguardar pagamento',
  pago: 'Pago',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const ROTULO_TICKET: Record<string, string> = {
  aberto: 'Aberto',
  em_analise: 'Em análise',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

export const stockLabel = (stock: number): string => {
  if (stock <= 0) return 'Esgotado';
  if (stock <= 3) return `Últimas ${stock} unidades`;
  if (stock <= 8) return 'Poucas unidades';
  return 'Disponível';
};
