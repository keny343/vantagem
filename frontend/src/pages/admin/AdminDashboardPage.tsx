import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useSession } from '../../auth/SessionContext';
import { useTitulo } from '../../hooks/useTitulo';
import { ErroBloco } from '../../ui/ErroBloco';
import { formatEuro } from '../../utils/format';

const saudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 19) return 'Boa tarde';
  return 'Boa noite';
};

export function AdminDashboardPage() {
  useTitulo('Painel');
  const { user } = useSession();
  const [resumo, setResumo] = useState<{
    products: number;
    orders: number;
    revenue: number;
    lowStock: number;
    pendingOrders: number;
    customers: number;
    openTickets: number;
    pendingProofs: number;
    lowStockItems?: { name: string; slug: string; quantity: number }[];
  } | null>(null);
  const [capa, setCapa] = useState<{ name: string; slug: string } | null>(null);
  const [erro, setErro] = useState('');

  function carregar() {
    setErro('');
    void api
      .adminResumo()
      .then(setResumo)
      .catch(() => setErro('Não foi possível carregar o resumo.'));
    void api
      .adminProdutos()
      .then((r) => {
        const hero = r.products.find((p) => p.hero);
        setCapa(hero ? { name: hero.name, slug: hero.slug } : null);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    carregar();
  }, []);

  const primeiro = (user?.name ?? '').split(' ')[0];
  const hoje = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-acid uppercase">
            {saudacao()}
            {primeiro ? `, ${primeiro}` : ''}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            Dashboard administrativo
          </h1>
          <p className="mt-1 font-mono text-[11px] text-steel">
            Visão da loja — esta conta gere, não compra
          </p>
        </div>
        <div className="font-mono text-[11px] text-steel">{hoje}</div>
      </div>

      {erro && (
        <div className="mt-6">
          <ErroBloco
            mensagem={erro}
            onTentar={carregar}
          />
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/pedidos">
          <Kpi tom="warn" label="Pedidos em curso" valor={resumo?.pendingOrders} />
        </Link>
        <Link to="/admin/pedidos?filtro=comprovativos">
          <Kpi tom="acid" label="Comprovativos por ver" valor={resumo?.pendingProofs} />
        </Link>
        <Kpi tom="acid" label="Stock baixo" valor={resumo?.lowStock} />
        <Link to="/admin/tickets">
          <Kpi tom="acid" label="Conversas abertas" valor={resumo?.openTickets} />
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Kpi quiet label="Artigos" valor={resumo?.products} />
        <Kpi quiet label="Pedidos" valor={resumo?.orders} />
        <Kpi quiet label="Clientes" valor={resumo?.customers} />
        <Kpi quiet label="Receita" valor={resumo ? formatEuro(resumo.revenue) : undefined} />
      </div>

      {resumo?.lowStockItems && resumo.lowStockItems.length > 0 && (
        <div className="mt-8 rounded-[14px] border border-line bg-panel p-5">
          <p className="label-mono">Stock baixo</p>
          <ul className="mt-3 space-y-2">
            {resumo.lowStockItems.map((a) => (
              <li key={a.slug} className="flex justify-between font-mono text-[12px]">
                <Link to={`/admin/produtos/${a.slug}`} className="text-acid hover:underline">
                  {a.name}
                </Link>
                <span className="text-steel">{a.quantity} un.</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-[14px] border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-mono">Capa da loja</p>
            <p className="mt-1 font-display text-lg text-ink">
              {capa ? capa.name : 'Nenhum artigo na capa'}
            </p>
            <p className="mt-1 font-mono text-[11px] text-steel">
              É o artigo grande que o cliente vê ao abrir o site.
            </p>
          </div>
          <Link
            to={capa ? `/admin/produtos/${capa.slug}` : '/admin/produtos'}
            className="grid h-10 place-items-center rounded-lg px-4 font-mono text-[11px] tracking-[0.12em] text-acid uppercase ring-1 ring-acid/40"
          >
            {capa ? 'Editar capa' : 'Escolher capa'}
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/admin/produtos/novo"
          className="grid h-10 place-items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
        >
          Novo artigo
        </Link>
        <Link
          to="/admin/categorias"
          className="grid h-10 place-items-center rounded-lg px-4 font-display text-sm text-ink ring-1 ring-line"
        >
          Categorias
        </Link>
        <Link
          to="/admin/pedidos"
          className="grid h-10 place-items-center rounded-lg px-4 font-display text-sm text-ink ring-1 ring-line"
        >
          Gerir pedidos
        </Link>
        <Link
          to="/admin/tickets"
          className="grid h-10 place-items-center rounded-lg px-4 font-display text-sm text-ink ring-1 ring-line"
        >
          Mensagens
        </Link>
      </div>
    </div>
  );
}

function Kpi({
  label,
  valor,
  tom,
  quiet,
}: {
  label: string;
  valor: number | string | undefined;
  tom?: 'acid' | 'warn';
  quiet?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border border-line bg-panel p-5 ${
        quiet ? '' : tom === 'warn' ? 'ring-1 ring-warn/30' : 'ring-1 ring-acid/20'
      }`}
    >
      <div className="label-mono">{label}</div>
      <div className="mt-2 font-display text-2xl text-ink">{valor ?? '—'}</div>
    </div>
  );
}
