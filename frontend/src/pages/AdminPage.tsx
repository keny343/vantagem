import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, type Product } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { StoreShell } from '../layout/StoreShell';
import { formatEuro } from '../utils/format';

type Tab = 'resumo' | 'stock' | 'pedidos';

export function AdminPage() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState<Tab>('resumo');
  const [resumo, setResumo] = useState<{
    products: number;
    orders: number;
    revenue: number;
    lowStock: number;
  } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<
    {
      id: string;
      reference: string;
      status: string;
      customerName: string;
      customerEmail: string;
      total: number;
      createdAt: string;
    }[]
  >([]);
  const [msg, setMsg] = useState('');

  async function carregar() {
    const [r, p, o] = await Promise.all([
      api.adminResumo(),
      api.adminProdutos(),
      api.adminPedidos(),
    ]);
    setResumo(r);
    setProducts(p.products);
    setOrders(o.orders);
  }

  useEffect(() => {
    if (user?.role !== 'admin') return;
    void carregar().catch(() => setMsg('Sem acesso ao painel.'));
  }, [user]);

  if (loading) {
    return (
      <StoreShell>
        <div className="mt-16 text-center font-mono text-steel">A carregar…</div>
      </StoreShell>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <StoreShell>
        <div className="mt-16 text-center">
          <h1 className="font-display text-2xl text-ink">Acesso restrito</h1>
          <p className="mt-2 font-mono text-[11px] text-steel">
            Esta área é só para administradores.
          </p>
          <Link to="/conta" className="mt-6 inline-grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-canvas">
            Ir para a conta
          </Link>
        </div>
      </StoreShell>
    );
  }

  async function guardarStock(e: FormEvent<HTMLFormElement>, slug: string) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const quantity = Number(data.get('quantity'));
    await api.adminStock(slug, quantity);
    setMsg(`Stock de ${slug} actualizado.`);
    await carregar();
  }

  async function mudarEstado(id: string, status: string) {
    await api.adminEstado(id, status);
    setMsg(`Pedido actualizado para ${status}.`);
    await carregar();
  }

  return (
    <StoreShell>
      <div className="mt-8">
        <div className="label-mono">Administração</div>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Painel</h1>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['resumo', 'Resumo'],
            ['stock', 'Stock'],
            ['pedidos', 'Pedidos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-9 rounded-md px-4 font-mono text-[11px] tracking-[0.12em] uppercase ${
              tab === id ? 'bg-acid text-canvas' : 'text-steel ring-1 ring-line hover:text-acid'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="mt-4 font-mono text-[11px] text-acid">{msg}</p>}

      {tab === 'resumo' && resumo && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Produtos', String(resumo.products)],
            ['Pedidos', String(resumo.orders)],
            ['Receita', formatEuro(resumo.revenue)],
            ['Stock baixo', String(resumo.lowStock)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[14px] border border-line bg-panel p-5">
              <div className="label-mono">{label}</div>
              <div className="mt-2 font-display text-2xl text-ink">{value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stock' && (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-panel">
          {products.map((p) => (
            <form
              key={p.id}
              onSubmit={(e) => void guardarStock(e, p.id)}
              className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-b-0"
            >
              <div className="min-w-[180px] flex-1">
                <div className="font-display text-ink">{p.name}</div>
                <div className="font-mono text-[10px] text-steel">
                  {p.sku} · {p.brand}
                </div>
              </div>
              <input
                name="quantity"
                type="number"
                min={0}
                defaultValue={p.stock}
                className="h-9 w-24 rounded-md border border-line bg-panel2 px-2 font-mono text-sm"
              />
              <button className="h-9 rounded-md bg-acid px-3 font-mono text-[11px] text-canvas uppercase">
                Guardar
              </button>
            </form>
          ))}
        </div>
      )}

      {tab === 'pedidos' && (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-panel">
          {orders.length === 0 && (
            <p className="p-6 font-mono text-[11px] text-steel">Ainda não há pedidos.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-b-0"
            >
              <div className="min-w-[160px] flex-1">
                <div className="font-mono text-[11px] text-acid">{o.reference}</div>
                <div className="font-display text-ink">{o.customerName}</div>
                <div className="font-mono text-[10px] text-steel">{o.customerEmail}</div>
              </div>
              <div className="font-display text-ink">{formatEuro(o.total)}</div>
              <select
                value={o.status}
                onChange={(e) => void mudarEstado(o.id, e.target.value)}
                className="h-9 rounded-md border border-line bg-panel2 px-2 font-mono text-[11px]"
              >
                {['pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado'].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>
          ))}
        </div>
      )}
    </StoreShell>
  );
}
