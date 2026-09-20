import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { request } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { StoreShell } from '../layout/StoreShell';
import { useTitulo } from '../hooks/useTitulo';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro, estadoEncomenda } from '../utils/format';

interface DashboardData {
  utilizador: { nome: string; email: string };
  estatisticas: { pedidos: number; favoritos: number; cupons: number };
  pedidosRecentes: Array<{
    referencia: string;
    total: number;
    estado: string;
    comprovativoUrl?: string | null;
    data: string;
  }>;
}

export default function ContaDashboardPage() {
  useTitulo('Conta');
  const { user, loading: sessionLoading, logout } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [erro, setErro] = useState('');

  function carregar() {
    setErro('');
    void request<DashboardData>('/api/conta/dashboard')
      .then(setData)
      .catch(() => setErro('Não foi possível carregar a conta.'));
  }

  useEffect(() => {
    if (!user) return;
    carregar();
  }, [user]);

  if (sessionLoading) {
    return (
      <StoreShell>
        <div className="mt-16 text-center font-mono text-steel">A carregar…</div>
      </StoreShell>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <StoreShell>
      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="label-mono">Conta</div>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white">
            Olá, {data?.utilizador.nome ?? user.name}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-steel">
            {data?.utilizador.email ?? user.email}
          </p>
          <p className="mt-2 inline-flex rounded-md bg-panel px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-zinc-300 uppercase ring-1 ring-line">
            Conta de cliente
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void logout()}
            className="h-10 rounded-lg px-4 font-mono text-[11px] tracking-[0.12em] text-steel uppercase ring-1 ring-line hover:text-acid"
          >
            Sair
          </button>
        </div>
      </div>

      {erro && (
        <div className="mt-6">
          <ErroBloco
            mensagem={erro}
            onTentar={carregar}
            extra={<Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">Ajuda</Link>}
          />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/conta/pedidos"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-steel uppercase">Pedidos</p>
          <p className="mt-2 font-display text-3xl text-white">{data?.estatisticas.pedidos ?? '—'}</p>
        </Link>
        <Link
          to="/conta/favoritos"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-steel uppercase">Favoritos</p>
          <p className="mt-2 font-display text-3xl text-white">{data?.estatisticas.favoritos ?? '—'}</p>
        </Link>
        <Link
          to="/conta/cupons"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-steel uppercase">Cupons</p>
          <p className="mt-2 font-display text-3xl text-white">{data?.estatisticas.cupons ?? '—'}</p>
        </Link>
      </div>

      <section className="mt-8 rounded-[14px] border border-line bg-panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-lg text-white">Pedidos recentes</h2>
          <Link to="/conta/pedidos" className="font-mono text-[11px] text-acid uppercase">
            Ver todos
          </Link>
        </div>
        {!data || data.pedidosRecentes.length === 0 ? (
          <p className="mt-4 font-mono text-[11px] text-steel">Ainda não tens pedidos.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {data.pedidosRecentes.map((pedido) => (
              <Link
                key={pedido.referencia}
                to={`/pedido/${encodeURIComponent(pedido.referencia)}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-acid"
              >
                <div>
                  <div className="font-mono text-[11px] text-acid">{pedido.referencia}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-steel">
                    {new Date(pedido.data).toLocaleDateString('pt-PT')}
                  </div>
                  <div className="mt-1 inline-flex rounded-md bg-panel2 px-2 py-1 font-mono text-[10px] text-zinc-200 ring-1 ring-line">
                    {estadoEncomenda({
                      status: pedido.estado,
                      comprovativoUrl: pedido.comprovativoUrl ?? null,
                    })}
                  </div>
                </div>
                <div className="font-display text-white">{formatEuro(pedido.total)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/conta/perfil"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-display text-white">Editar perfil</p>
          <p className="mt-1 font-mono text-[11px] text-steel">Dados pessoais e contacto</p>
        </Link>
        <Link
          to="/conta/enderecos"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-display text-white">Endereços</p>
          <p className="mt-1 font-mono text-[11px] text-steel">Moradas de entrega</p>
        </Link>
        <Link
          to="/conta/suporte"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-display text-white">Conversas com a loja</p>
          <p className="mt-1 font-mono text-[11px] text-steel">
            Encomenda em atraso, danificada ou outro problema
          </p>
        </Link>
        <Link
          to="/conta/devolucoes"
          className="rounded-[14px] border border-line bg-panel p-5 transition-colors hover:border-acid/40"
        >
          <p className="font-display text-white">Devoluções</p>
          <p className="mt-1 font-mono text-[11px] text-steel">Até 14 dias após a entrega</p>
        </Link>
      </div>
    </StoreShell>
  );
}
