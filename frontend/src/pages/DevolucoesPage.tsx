import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, ApiError, type Order } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { Campo } from '../ui/Campo';
import { ErroBloco } from '../ui/ErroBloco';

const MOTIVOS = ['Não era o esperado', 'Avaria', 'Encomenda incompleta', 'Outro'];

export default function DevolucoesPage() {
  const { user, loading: sessionLoading } = useSession();
  const { avisar } = useAvisos();
  useTitulo('Devoluções');
  const [lista, setLista] = useState<
    { id: string; pedido_id: string; motivo: string; descricao: string | null; estado: string; created_at: string }[]
  >([]);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [pedidoId, setPedidoId] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]!);
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [d, p] = await Promise.all([api.devolucoes(), api.meusPedidos()]);
      setLista(d.devolucoes);
      const entregues = p.orders.filter((o) => o.status === 'entregue');
      setPedidos(entregues);
      if (!pedidoId && entregues[0]) setPedidoId(entregues[0].id);
    } catch {
      setErro('Não foi possível carregar as devoluções.');
    }
  }, [pedidoId]);

  useEffect(() => {
    if (user) void carregar();
  }, [user, carregar]);

  async function criar(e: FormEvent) {
    e.preventDefault();
    try {
      await api.criarDevolucao({ pedido_id: pedidoId, motivo, descricao });
      setDescricao('');
      avisar('Pedido de devolução enviado.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível pedir a devolução.');
    }
  }

  if (sessionLoading) {
    return (
      <StoreShell>
        <p className="mt-16 text-center font-mono text-steel">A carregar…</p>
      </StoreShell>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <StoreShell>
      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="label-mono">Conta</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Devoluções</h1>
        </div>
        <Link to="/conta" className="font-mono text-[11px] text-steel hover:text-acid">
          Voltar
        </Link>
      </div>
      {erro && (
        <div className="mt-6">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}
      {pedidos.length === 0 ? (
        <p className="mt-8 font-mono text-[11px] text-steel">
          Só podes pedir devolução depois da encomenda estar entregue.
        </p>
      ) : (
        <form onSubmit={(e) => void criar(e)} className="mt-8 max-w-xl space-y-3 rounded-[14px] border border-line bg-panel p-5">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Encomenda</span>
            <select
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm"
            >
              {pedidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Motivo</span>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm"
            >
              {MOTIVOS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <Campo id="dev-desc" label="Detalhe (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <button className="h-10 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas">
            Pedir devolução
          </button>
        </form>
      )}
      <div className="mt-8 space-y-3">
        {lista.map((d) => (
          <article key={d.id} className="rounded-[14px] border border-line bg-panel p-4">
            <p className="font-display text-ink">{d.motivo}</p>
            <p className="mt-1 font-mono text-[11px] text-steel">
              {d.estado} · {new Date(d.created_at).toLocaleDateString('pt-PT')}
            </p>
            {d.descricao && <p className="mt-2 text-sm text-steel">{d.descricao}</p>}
          </article>
        ))}
      </div>
    </StoreShell>
  );
}
