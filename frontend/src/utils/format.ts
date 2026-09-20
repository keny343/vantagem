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
  pendente: 'À espera da loja',
  pago: 'Pago — a loja confirmou. O entregador vai entrar em contacto e receberá a encomenda ainda hoje',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export function estadoEncomenda(order: {
  status: string;
  comprovativoUrl?: string | null;
}): string {
  if (order.status === 'pendente' && order.comprovativoUrl) {
    return 'À espera da loja confirmar o pagamento';
  }
  if (order.status === 'pendente') {
    return 'À espera do comprovativo';
  }
  return ROTULO_ESTADO[order.status] ?? order.status;
}

export const ROTULO_TICKET: Record<string, string> = {
  aberto: 'Aberto',
  em_analise: 'Em análise',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

export const ROTULO_CATEGORIA_TICKET: Record<string, string> = {
  pedido: 'Encomenda',
  pagamento: 'Pagamento',
  entrega: 'Entrega',
  devolucao: 'Devolução',
  produto: 'Artigo',
  conta: 'Conta',
  outro: 'Outro',
};

export const stockLabel = (stock: number): string => {
  if (stock <= 0) return 'Esgotado';
  if (stock <= 3) return `Últimas ${stock} unidades`;
  if (stock <= 8) return 'Poucas unidades';
  return 'Disponível';
};
