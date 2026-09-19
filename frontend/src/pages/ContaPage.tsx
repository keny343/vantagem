import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, type Order } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { StoreShell } from '../layout/StoreShell';
import { formatEuro } from '../utils/format';

export function ContaPage() {
  const { user, loading, logout } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    void api.meusPedidos().then((r) => setOrders(r.orders)).catch(() => setOrders([]));
  }, [user]);

  if (loading) {
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
          <h1 className="mt-1 font-display text-2xl font-semibold text-white">{user.name}</h1>
          <p className="mt-1 font-mono text-[11px] text-steel">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="grid h-10 place-items-center rounded-lg px-4 font-mono text-[11px] tracking-[0.12em] text-acid uppercase ring-1 ring-acid/40"
            >
              Painel
            </Link>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="h-10 rounded-lg px-4 font-mono text-[11px] tracking-[0.12em] text-steel uppercase ring-1 ring-line hover:text-acid"
          >
            Sair
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-[14px] border border-line bg-panel p-6">
        <h2 className="font-display text-lg text-white">Os teus pedidos</h2>
        {orders.length === 0 ? (
          <p className="mt-4 font-mono text-[11px] text-steel">Ainda não há pedidos nesta conta.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-mono text-[11px] text-acid">{o.reference}</div>
                  <div className="mt-1 font-display text-white">{formatEuro(o.total)}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-steel">
                    {new Date(o.createdAt).toLocaleString('pt-PT')} · {o.status}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-steel">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}
