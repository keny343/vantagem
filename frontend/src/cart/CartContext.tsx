import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from '../auth/SessionContext';
import { eAdmin } from '../auth/papeis';
import { envioDe } from '../config/loja';

export interface CartLine {
  id: string;
  name: string;
  variant: string;
  price: number;
  image: string;
  qty: number;
  stock: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  open: boolean;
  bump: number;
  ready: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartLine, 'qty'>, qty?: number) => void;
  remove: (id: string, variant: string) => CartLine | null;
  setQty: (id: string, variant: string, qty: number) => void;
  desfazer: () => boolean;
  clear: () => void;
}

const STORAGE = 'vantagem_carrinho_v1';
const CartContext = createContext<CartContextValue | null>(null);

const asLine = (raw: unknown): CartLine | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null;
  if (typeof o.variant !== 'string' || typeof o.price !== 'number') return null;
  const qty = typeof o.qty === 'number' ? o.qty : 0;
  const stock = typeof o.stock === 'number' ? o.stock : 99;
  if (qty <= 0) return null;
  return {
    id: o.id,
    name: o.name,
    variant: o.variant,
    price: o.price,
    image: typeof o.image === 'string' ? o.image : '',
    qty: Math.min(qty, Math.max(1, stock)),
    stock,
  };
};

const load = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(asLine).filter((l): l is CartLine => l !== null);
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [ready, setReady] = useState(false);
  const [retirado, setRetirado] = useState<CartLine | null>(null);

  useEffect(() => {
    setLines(load());
    setReady(true);
  }, []);

  useEffect(() => {
    setOpen(false);
    if (eAdmin(user)) setLines([]);
  }, [user]);

  useEffect(() => {
    if (!ready || eAdmin(user)) return;
    localStorage.setItem(STORAGE, JSON.stringify(lines));
  }, [lines, ready, user]);

  const abrir = useCallback(
    (open: boolean) => {
      if (eAdmin(user)) {
        setOpen(false);
        return;
      }
      setOpen(open);
    },
    [user],
  );

  const add = useCallback((item: Omit<CartLine, 'qty'>, qty = 1) => {
    if (eAdmin(user)) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.id === item.id && l.variant === item.variant);
      const stock = item.stock;
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, qty: Math.min(stock, l.qty + qty), stock, price: item.price } : l,
        );
      }
      return [...prev, { ...item, qty: Math.min(stock, qty) }];
    });
    setBump((b) => b + 1);
    setOpen(true);
  }, [user]);

  const remove = useCallback((id: string, variant: string) => {
    let extraido: CartLine | null = null;
    setLines((prev) => {
      extraido = prev.find((l) => l.id === id && l.variant === variant) ?? null;
      return prev.filter((l) => !(l.id === id && l.variant === variant));
    });
    if (extraido) setRetirado(extraido);
    return extraido;
  }, []);

  const setQty = useCallback((id: string, variant: string, qty: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.id !== id || l.variant !== variant) return [l];
        if (qty <= 0) {
          setRetirado(l);
          return [];
        }
        return [{ ...l, qty: Math.min(l.stock, qty) }];
      }),
    );
  }, []);

  const desfazer = useCallback(() => {
    if (!retirado) return false;
    const linha = retirado;
    setLines((prev) => {
      if (prev.some((l) => l.id === linha.id && l.variant === linha.variant)) return prev;
      return [...prev, linha];
    });
    setRetirado(null);
    return true;
  }, [retirado]);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const shipping = envioDe(subtotal);
    return {
      lines,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      open,
      bump,
      ready,
      setOpen: abrir,
      add,
      remove,
      setQty,
      desfazer,
      clear,
    };
  }, [lines, open, bump, ready, abrir, add, remove, setQty, desfazer, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart fora do CartProvider');
  return ctx;
}
