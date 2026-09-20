import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { Conversa, type MensagemChat } from '../ui/Conversa';
import { ErroBloco } from '../ui/ErroBloco';
import { ROTULO_CATEGORIA_TICKET, ROTULO_TICKET } from '../utils/format';

export default function TicketPage() {
  const { id = '' } = useParams();
  const { user, loading } = useSession();
  const [ticket, setTicket] = useState<{
    assunto: string;
    descricao: string;
    estado: string;
    categoria: string;
    pedidoReferencia: string | null;
    created_at: string;
  } | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [erro, setErro] = useState('');
  useTitulo(ticket?.assunto ?? 'Conversa');

  async function carregar() {
    const r = await api.ticket(id);
    setTicket(r.ticket);
    const abertura: MensagemChat = {
      id: 'abertura',
      texto: r.ticket.descricao,
      createdAt: r.ticket.created_at,
      autorNome: user?.name ?? 'Tu',
      papel: 'cliente',
    };
    setMensagens([abertura, ...r.mensagens]);
  }

  useEffect(() => {
    if (!user) return;
    void carregar().catch(() => setErro('Conversa não encontrada.'));
    const t = window.setInterval(() => {
      void carregar().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(t);
  }, [user, id]);

  async function enviar(texto: string) {
    await api.responderTicket(id, texto);
    await carregar();
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
        ← Conversas
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-white">{ticket.assunto}</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        {ROTULO_TICKET[ticket.estado] ?? ticket.estado} ·{' '}
        {ROTULO_CATEGORIA_TICKET[ticket.categoria] ?? ticket.categoria}
        {ticket.pedidoReferencia ? ` · ${ticket.pedidoReferencia}` : ''}
      </p>
      {ticket.pedidoReferencia && (
        <Link
          to={`/pedido/${encodeURIComponent(ticket.pedidoReferencia)}`}
          className="mt-2 inline-block font-mono text-[11px] text-acid"
        >
          Ver encomenda
        </Link>
      )}
      {erro && <p className="mt-3 font-mono text-[11px] text-destructive">{erro}</p>}
      <div className="mt-6 max-w-2xl">
        <Conversa
          mensagens={mensagens}
          papelEu="cliente"
          fechado={ticket.estado === 'fechado'}
          onEnviar={async (texto) => {
            try {
              await enviar(texto);
            } catch (err) {
              setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar.');
              throw err;
            }
          }}
          placeholder="Ex.: a encomenda ainda não chegou, chegou danificada…"
        />
      </div>
    </StoreShell>
  );
}
