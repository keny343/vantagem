import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface CartLine {
  id: string;
  name: string;
  variant: string;
  price: number;
  image: string;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  open: boolean;
  bump: number;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartLine, 'qty'>, qty?: number) => void;
  remove: (id: string, variant: string) => void;
  setQty: (id: string, variant: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);

  const add = useCallback((item: Omit<CartLine, 'qty'>, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === item.id && l.variant === item.variant);
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { ...item, qty }];
    });
    setBump((b) => b + 1);
    setOpen(true);
  }, []);

  const remove = useCallback((id: string, variant: string) => {
    setLines((prev) => prev.filter((l) => !(l.id === id && l.variant === variant)));
  }, []);

  const setQty = useCallback((id: string, variant: string, qty: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.id !== id || l.variant !== variant) return [l];
        if (qty <= 0) return [];
        return [{ ...l, qty }];
      }),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const shipping = subtotal === 0 || subtotal >= 90 ? 0 : 4.9;
    return {
      lines,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      open,
      bump,
      setOpen,
      add,
      remove,
      setQty,
      clear,
    };
  }, [lines, open, bump, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>');
  return ctx;
}
