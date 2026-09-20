import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { TemaToggle } from '../ui/TemaToggle';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/produtos', label: 'Artigos' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/cupons', label: 'Cupons' },
  { to: '/admin/utilizadores', label: 'Utilizadores' },
  { to: '/admin/tickets', label: 'Mensagens' },
];

export function AdminLayout() {
  const { user, loading, logout } = useSession();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas font-mono text-steel">
        A carregar…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/conta" replace />;

  const nav = (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          {...(item.end ? { end: true } : {})}
          onClick={() => setMenu(false)}
          className={({ isActive }) =>
            `relative flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-acid/15 font-semibold text-ink before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-acid'
                : 'text-ink/70 hover:bg-panel2 hover:text-ink'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink/80">
      {menu && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}

      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-panel px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="h-9 rounded-md px-3 font-mono text-xs text-ink/70 ring-1 ring-line"
        >
          Menu
        </button>
        <span className="font-display text-sm font-semibold text-ink">Painel</span>
        <div className="flex items-center gap-2">
          <TemaToggle />
          <Link to="/" className="font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
            Loja
          </Link>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 z-50 flex h-dvh w-60 flex-col border-r border-line bg-panel p-3 transition-transform lg:translate-x-0 ${
          menu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-4 flex items-center gap-3 px-1 py-2">
          <div className="grid size-10 place-items-center rounded-md bg-acid font-display text-sm font-bold text-canvas">
            VT
          </div>
          <div>
            <div className="font-display text-sm font-semibold text-ink">Vantagem</div>
            <div className="font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
              Painel administrativo
            </div>
          </div>
        </div>

          <div className="mb-3 border-b border-line px-1 pb-3">
          <p className="font-display text-sm text-ink">{user.name}</p>
          <p className="font-mono text-[10px] text-steel">{user.email}</p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-acid uppercase">
            Administrador · não compra
          </p>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">{nav}</nav>

        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <div className="px-1 pb-1">
            <TemaToggle className="w-full" />
          </div>
          <Link
            to="/"
            className="flex min-h-9 items-center rounded-md px-3 text-sm text-ink/70 hover:bg-panel2 hover:text-ink"
          >
            Ver loja
          </Link>
          <Link
            to="/ajuda"
            className="flex min-h-9 items-center rounded-md px-3 text-sm text-ink/70 hover:bg-panel2 hover:text-ink"
          >
            Ajuda
          </Link>
          <button
            type="button"
            onClick={() => {
              void logout().then(() => navigate('/login'));
            }}
            className="flex min-h-9 w-full items-center rounded-md border border-line px-3 text-sm text-ink/80 hover:bg-panel2"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 pt-14 lg:ml-60 lg:pt-0">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
