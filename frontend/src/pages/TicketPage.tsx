import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { ErroBloco } from '../ui/ErroBloco';
import { ROTULO_TICKET } from '../utils/format';

export default function TicketPage() {
  const { id = '' } = useParams();
  const { user, loading } = useSession();
  const [ticket, setTicket] = useState<{
    assunto: string;
    descricao: string;
    estado: string;
    categoria: string;
  } | null>(null);
  const [respostas, setRespostas] = useState<{ id: string; mensagem: string; created_at: string }[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  useTitulo(ticket?.assunto ?? 'Pedido de ajuda');

  async function carregar() {
    const r = await api.ticket(id);
    setTicket(r.ticket);
    setRespostas(r.respostas);
  }

  useEffect(() => {
    if (!user) return;
    void carregar().catch(() => setErro('Pedido de ajuda não encontrado.'));
  }, [user, id]);

  async function responder(e: FormEvent) {
    e.preventDefault();
    try {
      await api.responderTicket(id, mensagem);
      setMensagem('');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível responder.');
    }
  }

  if (loading) {
    return (
      <StoreShell>
        <p className="mt-16 text-center font-mono text-steel">A carregar…</p>
      </StoreShell>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (erro && !ticket) {
    return (
      <StoreShell>
        <div className="mt-16 max-w-lg">
          <ErroBloco mensagem={erro} extra={<Link to="/conta/suporte" className="text-acid">Voltar</Link>} />
        </div>
      </StoreShell>
    );
  }
  if (!ticket) {
    return (
      <StoreShell>
        <p className="mt-16 font-mono text-steel">A carregar…</p>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <Link to="/conta/suporte" className="mt-8 inline-block font-mono text-[11px] text-steel hover:text-acid">
        ← Pedidos de ajuda
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-white">{ticket.assunto}</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        {ROTULO_TICKET[ticket.estado] ?? ticket.estado} · {ticket.categoria}
      </p>
      <p className="mt-4 max-w-2xl text-zinc-300">{ticket.descricao}</p>
      <div className="mt-6 max-w-2xl space-y-3">
        {respostas.map((r) => (
          <article key={r.id} className="rounded-[14px] border border-line bg-panel p-4">
            <p className="text-sm text-zinc-200">{r.mensagem}</p>
            <p className="mt-2 font-mono text-[10px] text-steel">{new Date(r.created_at).toLocaleString('pt-PT')}</p>
          </article>
        ))}
      </div>
      <form onSubmit={(e) => void responder(e)} className="mt-6 max-w-2xl space-y-3">
        <textarea
          required
          rows={3}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
          placeholder="Escreve uma resposta…"
        />
        <button className="h-10 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-ink">
          Responder
        </button>
      </form>
    </StoreShell>
  );
}
