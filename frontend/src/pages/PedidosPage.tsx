import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, type Order } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro, estadoEncomenda } from '../utils/format';

export default function PedidosPage() {
  const { user, loading: sessionLoading } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  useTitulo('Pedidos');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const r = await api.meusPedidos();
      setOrders(r.orders);
    } catch {
      setErro('Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void carregar();
  }, [user, carregar]);

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
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <div className="label-mono">Conta</div>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Pedidos</h1>
        </div>
        <Link to="/conta" className="font-mono text-[11px] text-steel hover:text-acid">
          ← Voltar
        </Link>
      </div>

      {erro && (
        <div className="mt-6">
          <ErroBloco
            mensagem={erro}
            onTentar={() => void carregar()}
            extra={
              <Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">
                Ajuda
              </Link>
            }
          />
        </div>
      )}

      <section className="mt-8 rounded-[14px] border border-line bg-panel p-6">
        {loading ? (
          <p className="font-mono text-[11px] text-steel">A carregar pedidos…</p>
        ) : orders.length === 0 ? (
          <div className="text-center">
            <p className="font-mono text-[11px] text-steel">Ainda não há pedidos nesta conta.</p>
            <Link
              to="/catalogo"
              className="mt-4 inline-grid h-10 place-items-center rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas"
            >
              Ir ao catálogo
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-mono text-[11px] text-acid">{o.reference}</div>
                  <div className="mt-1 font-display text-ink">{formatEuro(o.total)}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-steel">
                    {new Date(o.createdAt).toLocaleString('pt-PT')}
                  </div>
                  <div className="mt-2 inline-flex rounded-md bg-panel2 px-2 py-1 font-mono text-[10px] text-ink/80 ring-1 ring-line">
                    {estadoEncomenda(o)}
                  </div>
                </div>
                <Link
                  to={`/pedido/${encodeURIComponent(o.reference)}`}
                  className="font-mono text-[10px] tracking-[0.12em] text-acid uppercase"
                >
                  Ver encomenda
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}
