import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { urlMedia } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { eAdmin } from '../auth/papeis';
import { useCart } from '../cart/CartContext';
import { LOJA } from '../config/loja';
import { useAvisos } from '../ui/Avisos';
import { Notificacoes } from '../ui/Notificacoes';
import { formatEuro } from '../utils/format';

const NAV_PUBLIC = [
  { to: '/', label: 'Início', end: true },
  { to: '/catalogo', label: 'Catálogo' },
];

const NAV_CLIENTE = [
  { to: '/', label: 'Início', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/conta/suporte', label: 'Mensagens' },
  { to: '/conta', label: 'Conta' },
];

const NAV_ADMIN = [
  { to: '/', label: 'Início', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/admin', label: 'Painel' },
];

function CartDrawer() {
  const cart = useCart();
  const { user } = useSession();
  const { avisar } = useAvisos();

  function retirar(id: string, variant: string) {
    cart.remove(id, variant);
    avisar('Artigo retirado do carrinho.', {
      tipo: 'info',
      acao: { label: 'Anular', onClick: () => cart.desfazer() },
    });
  }

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
        role="dialog"
        aria-modal={cart.open}
        aria-label="Carrinho"
        aria-hidden={!cart.open}
        inert={!cart.open ? true : undefined}
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
              Carrinho vazio.{' '}
              <Link to="/catalogo" onClick={() => cart.setOpen(false)} className="text-acid">
                Ver catálogo
              </Link>
            </p>
          )}
          {cart.lines.map((line) => (
            <div key={line.id + line.variant} className="rise flex gap-3">
              <img
                src={urlMedia(line.image)}
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
                      onClick={() =>
                        line.qty <= 1
                          ? retirar(line.id, line.variant)
                          : cart.setQty(line.id, line.variant, line.qty - 1)
                      }
                      className="px-2 font-mono text-xs text-steel hover:text-acid"
                      aria-label="Diminuir quantidade"
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
                    onClick={() => retirar(line.id, line.variant)}
                    className="ml-auto font-mono text-[10px] tracking-[0.1em] text-steel uppercase hover:text-destructive"
                    aria-label={`Retirar ${line.name} do carrinho`}
                  >
                    Retirar
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
            to={user ? '/checkout' : '/login'}
            onClick={() => cart.setOpen(false)}
            className="grid h-11 w-full place-items-center rounded-lg bg-acid font-display text-sm font-semibold text-ink transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            {user ? 'Finalizar compra' : 'Entrar para comprar'}
          </Link>
          <Link
            to={user ? '/carrinho' : '/login'}
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
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const admin = eAdmin(user);
  const nav = loading ? NAV_PUBLIC : admin ? NAV_ADMIN : NAV_CLIENTE;

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void navigate(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo');
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-line/70">
      {admin && (
        <div className="border-b border-acid/30 bg-acid/10">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-5 py-2 sm:px-8">
            <p className="font-mono text-[11px] tracking-[0.08em] text-acid uppercase">
              A ver a loja como administrador — não podes comprar
            </p>
            <Link
              to="/admin"
              className="font-mono text-[10px] tracking-[0.14em] text-white uppercase hover:text-acid"
            >
              Ir para o painel →
            </Link>
          </div>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-white">
          <span className="inline-block size-2.5 rounded-[2px] bg-acid" />
          <span className="text-lg tracking-tight">VANTAGEM</span>
          <span className="hidden font-mono text-[10px] tracking-[0.2em] text-steel uppercase sm:inline">
            / electrónica
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-7 font-mono text-[11px] tracking-[0.15em] text-steel uppercase md:flex">
          {nav.map((item) => (
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
              id="pesquisa-loja"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-steel/70"
              placeholder="Pesquisar artigos…"
              aria-label="Pesquisar produtos"
              aria-keyshortcuts="/"
            />
          </form>
          {loading ? (
            <span className="hidden h-9 w-24 sm:block" aria-hidden />
          ) : admin ? (
            <span className="hidden h-9 items-center rounded-md bg-acid/15 px-3 font-mono text-[10px] tracking-[0.14em] text-acid uppercase ring-1 ring-acid/40 sm:flex">
              Administrador
            </span>
          ) : (
            <>
              <Notificacoes />
              <Link
                to={user ? '/conta' : '/login'}
                className="hidden h-9 items-center rounded-md px-3 font-mono text-[11px] tracking-[0.12em] text-steel uppercase transition-colors hover:text-acid sm:flex"
              >
                {user ? user.name.split(' ')[0] : 'Entrar'}
              </Link>
            </>
          )}
          {loading ? (
            <span className="h-9 w-20" aria-hidden />
          ) : admin ? (
            <Link
              to="/admin"
              className="h-9 rounded-md bg-panel px-3 font-mono text-[11px] leading-9 tracking-[0.12em] text-zinc-300 uppercase ring-1 ring-line transition-colors hover:text-acid"
            >
              Painel
            </Link>
          ) : (
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
          )}
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
          {[...nav, ...(!user ? [{ to: '/login', label: 'Entrar' }] : [])].map((item) => (
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
      {!loading && !admin && <CartDrawer />}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-10 sm:grid-cols-3 sm:px-8">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold text-white">
            <span className="inline-block size-2.5 rounded-[2px] bg-acid" />
            {LOJA.nome}
          </div>
          <p className="mt-3 max-w-[36ch] font-mono text-[11px] leading-relaxed text-steel">
            {LOJA.nomeLegal}
            <br />
            NIF {LOJA.nif}
            <br />
            {LOJA.morada}
          </p>
        </div>
        <div className="flex flex-col gap-2 font-mono text-[11px] tracking-[0.12em] text-steel uppercase">
          <Link to="/catalogo" className="hover:text-acid">
            Catálogo
          </Link>
          <Link to="/empresa" className="hover:text-acid">
            Empresa
          </Link>
          <Link to="/termos" className="hover:text-acid">
            Termos
          </Link>
          <Link to="/devolucoes" className="hover:text-acid">
            Devoluções
          </Link>
          <Link to="/privacidade" className="hover:text-acid">
            Privacidade
          </Link>
          <Link to="/ajuda" className="hover:text-acid">
            Ajuda
          </Link>
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-steel">
          <div>{LOJA.email}</div>
          <div className="mt-1">{LOJA.telefone}</div>
          <div className="mt-3">Preços com IVA {Math.round(LOJA.taxaIva * 100)}% incluído.</div>
          <div className="mt-1">Atalho / para pesquisar · Esc para fechar o carrinho.</div>
          <div className="mt-1">© 2026 {LOJA.nomeLegal}</div>
        </div>
      </div>
    </footer>
  );
}

export function StoreShell({ children }: { children: ReactNode }) {
  const cart = useCart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const aEscrever =
        alvo &&
        (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
      if (e.key === 'Escape') {
        cart.setOpen(false);
        return;
      }
      if (e.key === '/' && !aEscrever && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('pesquisa-loja')?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart.setOpen]);

  return (
    <div className="min-h-screen bg-ink text-zinc-200 selection:bg-acid/30 selection:text-white">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-acid focus:px-3 focus:py-2 focus:font-display focus:text-sm focus:text-ink"
      >
        Saltar para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="mx-auto max-w-[1400px] px-5 pb-10 sm:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
