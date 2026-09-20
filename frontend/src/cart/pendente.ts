import type { CartLine } from './CartContext';

const CHAVE = 'vantagem_artigo_pendente';

export type ArtigoPendente = Omit<CartLine, 'qty'> & { qty: number };

export function guardarArtigoPendente(item: Omit<CartLine, 'qty'>, qty = 1): void {
  sessionStorage.setItem(CHAVE, JSON.stringify({ ...item, qty }));
}

export function consumirArtigoPendente(): ArtigoPendente | null {
  try {
    const raw = sessionStorage.getItem(CHAVE);
    sessionStorage.removeItem(CHAVE);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<ArtigoPendente>;
    if (typeof o.id !== 'string' || typeof o.name !== 'string') return null;
    if (typeof o.variant !== 'string' || typeof o.price !== 'number') return null;
    return {
      id: o.id,
      name: o.name,
      variant: o.variant,
      price: o.price,
      image: typeof o.image === 'string' ? o.image : '',
      stock: typeof o.stock === 'number' ? o.stock : 99,
      qty: typeof o.qty === 'number' && o.qty > 0 ? o.qty : 1,
    };
  } catch {
    sessionStorage.removeItem(CHAVE);
    return null;
  }
}
