import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { Campo } from '../ui/Campo';
import { ErroBloco } from '../ui/ErroBloco';
import { ROTULO_CATEGORIA_TICKET, ROTULO_TICKET } from '../utils/format';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

const CATS = [
  { id: 'pedido', label: 'Encomenda' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'entrega', label: 'Entrega (não chegou / danificada)' },
  { id: 'devolucao', label: 'Devolução' },
  { id: 'produto', label: 'Artigo' },
  { id: 'conta', label: 'Conta' },
  { id: 'outro', label: 'Outro' },
];

export default function SuportePage() {
  const { user, loading: sessionLoading } = useSession();
  const { avisar } = useAvisos();
  useTitulo('Conversas com a loja');
  const [lista, setLista] = useState<
    {
      id: string;
      categoria: string;
      assunto: string;
      descricao: string;
      estado: string;
      pedidoReferencia: string | null;
      created_at: string;
      updated_at: string;
    }[]
  >([]);
  const [erro, setErro] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('entrega');
  const [pedidoRef, setPedidoRef] = useState('');
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const r = await api.tickets();
      setLista(r.tickets);
    } catch {
      setErro('Não foi possível carregar as conversas.');
    }
  }, []);

  useEffect(() => {
    if (user) void carregar();
  }, [user, carregar]);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.criarTicket({
        categoria,
        assunto,
        descricao,
        ...(pedidoRef.trim() ? { pedidoReferencia: pedidoRef.trim() } : {}),
      });
      setAssunto('');
      setDescricao('');
      setPedidoRef('');
      avisar('Mensagem enviada. A loja responde nesta conversa.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar.');
    } finally {
      setBusy(false);
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
          <h1 className="mt-1 font-display text-2xl font-semibold text-white">Conversas com a loja</h1>
          <p className="mt-1 max-w-[52ch] font-mono text-[11px] text-steel">
            Reclamações, encomenda em atraso, artigo danificado ou qualquer problema. A loja responde aqui.
          </p>
        </div>
        <Link to="/conta" className="font-mono text-[11px] text-steel hover:text-acid">
          ← Voltar
        </Link>
      </div>
      {erro && (
        <div className="mt-6">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}
      <form
        onSubmit={(e) => void criar(e)}
        onInvalidCapture={onInvalidPt}
        onInput={onInputPt}
        className="mt-8 max-w-xl space-y-3 rounded-[14px] border border-line bg-panel p-5"
      >
        <label className="block" htmlFor="sup-cat">
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Assunto</span>
          <select
            id="sup-cat"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm"
          >
            {CATS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <Campo id="sup-ass" label="Título" required value={assunto} onChange={(e) => setAssunto(e.target.value)} />
        <Campo
          id="sup-ped"
          label="N.º da encomenda (se for o caso)"
          value={pedidoRef}
          onChange={(e) => setPedidoRef(e.target.value)}
          hint="Opcional. Liga a conversa a uma encomenda desta conta."
        />
        <label className="block" htmlFor="sup-desc">
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Mensagem</span>
          <textarea
            id="sup-desc"
            required
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
            placeholder="Ex.: a encomenda VT-… ainda não chegou / chegou com a caixa danificada…"
          />
        </label>
        <button
          disabled={busy}
          className="h-10 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-ink disabled:opacity-60"
        >
          {busy ? 'A enviar…' : 'Começar conversa'}
        </button>
      </form>
      <div className="mt-8 space-y-3">
        {lista.map((t) => (
          <Link
            key={t.id}
            to={`/conta/suporte/${t.id}`}
            className="block rounded-[14px] border border-line bg-panel p-4 hover:border-acid/40"
          >
            <div className="flex justify-between gap-3">
              <p className="font-display text-white">{t.assunto}</p>
              <span className="font-mono text-[10px] text-steel uppercase">
                {ROTULO_TICKET[t.estado] ?? t.estado}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-steel">
              {ROTULO_CATEGORIA_TICKET[t.categoria] ?? t.categoria}
              {t.pedidoReferencia ? ` · ${t.pedidoReferencia}` : ''} ·{' '}
              {new Date(t.updated_at).toLocaleString('pt-PT')}
            </p>
          </Link>
        ))}
      </div>
    </StoreShell>
  );
}
