import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { useCart } from '../cart/CartContext';
import { formatEuro } from '../utils/format';

const NAV = [
  { to: '/', label: 'Início', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/conta', label: 'Conta' },
  { to: '/admin', label: 'Painel' },
];

function CartDrawer() {
  const cart = useCart();
  return (
    <>
      <div
        onClick={() => cart.setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          cart.open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden
      />
      <aside
        className={`glass fixed top-0 right-0 z-50 flex h-full w-[360px] max-w-[88vw] flex-col border-l border-line transition-transform duration-300 ease-out ${
          cart.open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <span className="font-mono text-[11px] tracking-[0.18em] text-steel uppercase">
            Carrinho · {cart.count}
          </span>
          <button
            type="button"
            onClick={() => cart.setOpen(false)}
            className="font-mono text-sm text-steel transition-colors hover:text-acid"
            aria-label="Fechar carrinho"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {cart.lines.length === 0 && (
            <p className="font-mono text-[11px] leading-relaxed text-steel">
              Carrinho vazio. Explora o catálogo e adiciona o primeiro módulo.
            </p>
          )}
          {cart.lines.map((line) => (
            <div key={line.id + line.variant} className="rise flex gap-3">
              <img
                src={line.image}
                alt={line.name}
                loading="lazy"
                className="size-16 shrink-0 rounded-lg border border-line object-cover"
              />
              <div className="flex-1">
                <div className="font-display text-sm text-white">{line.name}</div>
                <div className="mt-0.5 font-mono text-[10px] text-steel">{line.variant}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-md border border-line">
                    <button
                      type="button"
                      onClick={() => cart.setQty(line.id, line.variant, line.qty - 1)}
                      className="px-2 font-mono text-xs text-steel hover:text-acid"
                      aria-label="Diminuir"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-mono text-xs text-zinc-200">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => cart.setQty(line.id, line.variant, line.qty + 1)}
                      className="px-2 font-mono text-xs text-steel hover:text-acid"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-mono text-xs text-acid">
                    {formatEuro(line.price * line.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => cart.remove(line.id, line.variant)}
                    className="ml-auto font-mono text-[10px] tracking-[0.1em] text-steel uppercase hover:text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto border-t border-line p-5">
          <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-steel">
            <span>Envio</span>
            <span>{cart.shipping === 0 ? 'Grátis' : formatEuro(cart.shipping)}</span>
          </div>
          <div className="mb-3 flex items-center justify-between font-display text-lg text-white">
            <span>Total</span>
            <span>{formatEuro(cart.total)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={() => cart.setOpen(false)}
            className="grid h-11 w-full place-items-center rounded-lg bg-acid font-display text-sm font-semibold text-ink transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            Finalizar compra
          </Link>
          <Link
            to="/carrinho"
            onClick={() => cart.setOpen(false)}
            className="mt-2 block text-center font-mono text-[10px] tracking-[0.12em] text-steel uppercase hover:text-acid"
          >
            Ver carrinho completo
          </Link>
        </div>
      </aside>
    </>
  );
}

function Header() {
  const cart = useCart();
  const { user } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void navigate(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo');
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-line/70">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-white">
          <span className="inline-block size-2.5 rounded-[2px] bg-acid" />
          <span className="text-lg tracking-tight">VANTAGEM</span>
          <span className="hidden font-mono text-[10px] tracking-[0.2em] text-steel uppercase sm:inline">
            / electrónica
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-7 font-mono text-[11px] tracking-[0.15em] text-steel uppercase md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              {...(item.end ? { end: true } : {})}
              className={({ isActive }) =>
                `transition-colors hover:text-acid ${isActive ? 'text-white' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={onSearch}
            className="hidden h-9 w-52 items-center gap-2 rounded-md bg-panel px-3 ring-1 ring-line focus-within:ring-acid/60 sm:flex"
          >
            <span className="font-mono text-xs text-steel">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-steel/70"
              placeholder="Pesquisar módulos…"
              aria-label="Pesquisar produtos"
            />
          </form>
          <Link
            to={user ? '/conta' : '/login'}
            className="hidden h-9 items-center rounded-md px-3 font-mono text-[11px] tracking-[0.12em] text-steel uppercase transition-colors hover:text-acid sm:flex"
          >
            {user ? user.name.split(' ')[0] : 'Entrar'}
          </Link>
          <button
            type="button"
            onClick={() => cart.setOpen(true)}
            className="relative h-9 rounded-md bg-panel px-3 font-mono text-[11px] tracking-[0.12em] text-zinc-300 uppercase ring-1 ring-line transition-colors hover:text-acid"
          >
            Carrinho
            {cart.count > 0 && (
              <span
                key={cart.bump}
                className="cart-bump absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-acid px-1 text-[10px] font-semibold text-ink"
              >
                {cart.count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="h-9 rounded-md bg-panel px-3 font-mono text-[11px] text-zinc-300 ring-1 ring-line md:hidden"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {menu && (
        <nav className="border-t border-line bg-panel px-5 py-3 font-mono text-[11px] tracking-[0.15em] text-steel uppercase md:hidden">
          {[...NAV, { to: '/login', label: 'Entrar' }].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenu(false)}
              className="block py-2 transition-colors hover:text-acid"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <CartDrawer />
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2 font-display font-semibold text-white">
          <span className="inline-block size-2.5 rounded-[2px] bg-acid" />
          VANTAGEM
        </div>
        <div className="flex flex-wrap gap-6 font-mono text-[11px] tracking-[0.12em] text-steel uppercase">
          <Link to="/catalogo" className="hover:text-acid">
            Catálogo
          </Link>
          <Link to="/conta" className="hover:text-acid">
            Conta
          </Link>
          <Link to="/admin" className="hover:text-acid">
            Painel
          </Link>
        </div>
        <div className="font-mono text-[10px] text-steel">© 2026 Vantagem · Lisboa</div>
      </div>
    </footer>
  );
}

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-zinc-200 selection:bg-acid/30 selection:text-white">
      <Header />
      <main className="mx-auto max-w-[1400px] px-5 pb-10 sm:px-8">{children}</main>
      <Footer />
    </div>
  );
}
