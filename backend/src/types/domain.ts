export type Perfil = 'cliente' | 'admin';

export interface Autenticado {
  readonly userId: string;
  readonly email: string;
  readonly nome: string;
  readonly perfil: Perfil;
  readonly sessionId: string;
}

export type EstadoPedido =
  | 'pendente'
  | 'pago'
  | 'em_preparacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export type MetodoPagamento = 'cartao' | 'mbway' | 'multibanco';

export interface ProdutoPublico {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  specs: string[];
  variants: { label: string; options: string[] };
  images: string[];
  description: string;
  badge: string | null;
  featured: boolean;
  sold: number;
}

/** Frontend prices are euros; DB stores cêntimos. */
export const eurosDeCentimos = (centimos: number): number => centimos / 100;

export const centimosDeEuros = (euros: number): number => Math.round(euros * 100);
