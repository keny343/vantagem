import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { Conversa, type MensagemChat } from '../../ui/Conversa';
import { ErroBloco } from '../../ui/ErroBloco';
import { ROTULO_CATEGORIA_TICKET, ROTULO_TICKET } from '../../utils/format';

export function AdminTicketPage() {
  const { id = '' } = useParams();
  const { avisar } = useAvisos();
  const [ticket, setTicket] = useState<{
    subject: string;
    description: string;
    status: string;
    category: string;
    pedidoReferencia: string | null;
    createdAt: string;
    customerName: string;
    customerEmail: string;
  } | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [erro, setErro] = useState('');
  useTitulo(ticket?.subject ?? 'Conversa');

  async function carregar() {
    const r = await api.adminTicket(id);
    setTicket(r.ticket);
    const abertura: MensagemChat = {
      id: 'abertura',
      texto: r.ticket.description,
      createdAt: r.ticket.createdAt,
      autorNome: r.ticket.customerName,
      papel: 'cliente',
    };
    setMensagens([abertura, ...r.mensagens]);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Conversa não encontrada.'));
    const t = window.setInterval(() => {
      void carregar().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(t);
  }, [id]);

  async function mudarEstado(status: string) {
    try {
      await api.adminActualizarTicket(id, status);
      avisar(`Conversa: ${ROTULO_TICKET[status] ?? status}.`);
      await carregar();
    } catch {
      setErro('Não foi possível actualizar o estado.');
    }
  }

  if (erro && !ticket) {
    return (
      <ErroBloco
        mensagem={erro}
        extra={
          <Link to="/admin/tickets" className="font-mono text-[11px] text-acid">
            Voltar
          </Link>
        }
      />
    );
  }
  if (!ticket) {
    return <p className="font-mono text-steel">A carregar…</p>;
  }

  return (
    <div>
      <Link to="/admin/tickets" className="font-mono text-[11px] text-steel hover:text-acid">
        Mensagens
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{ticket.subject}</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        {ticket.customerName} · {ticket.customerEmail} ·{' '}
        {ROTULO_CATEGORIA_TICKET[ticket.category] ?? ticket.category}
      </p>
      {ticket.pedidoReferencia && (
        <p className="mt-1 font-mono text-[11px] text-acid">Encomenda {ticket.pedidoReferencia}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(ROTULO_TICKET).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => void mudarEstado(valor)}
            className={`h-8 rounded-md px-3 font-mono text-[10px] uppercase ${
              ticket.status === valor
                ? 'bg-acid text-canvas'
                : 'text-ink/80 ring-1 ring-line hover:bg-panel2'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {erro && <p className="mt-3 font-mono text-[11px] text-destructive">{erro}</p>}
      <div className="mt-6 max-w-2xl">
        <Conversa
          mensagens={mensagens}
          papelEu="admin"
          fechado={ticket.status === 'fechado'}
          onEnviar={async (texto) => {
            try {
              await api.adminResponderTicket(id, texto);
              await carregar();
            } catch (err) {
              setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar.');
              throw err;
            }
          }}
        />
      </div>
    </div>
  );
}
