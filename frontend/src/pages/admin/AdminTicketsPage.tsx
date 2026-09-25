import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { ErroBloco } from '../../ui/ErroBloco';
import { ROTULO_CATEGORIA_TICKET, ROTULO_TICKET } from '../../utils/format';

export function AdminTicketsPage() {
  useTitulo('Mensagens');
  const [tickets, setTickets] = useState<
    {
      id: string;
      category: string;
      subject: string;
      description: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      customerName: string;
      customerEmail: string;
      pedidoReferencia: string | null;
      lastMessage: string;
      lastFrom: 'cliente' | 'admin';
    }[]
  >([]);
  const [erro, setErro] = useState('');

  async function carregar() {
    setErro('');
    const r = await api.adminTickets();
    setTickets(r.tickets);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar as conversas.'));
    const t = window.setInterval(() => {
      void carregar().catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div>
      <p className="label-mono">Loja</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Mensagens dos clientes</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        Reclamações, encomendas em atraso, artigos danificados. Abre a conversa para responder.
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-panel">
        {tickets.length === 0 && (
          <p className="p-6 font-mono text-[11px] text-steel">Ainda não há conversas.</p>
        )}
        {tickets.map((t) => (
          <Link
            key={t.id}
            to={`/admin/tickets/${t.id}`}
            className="block border-b border-line p-4 last:border-0 hover:bg-panel2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-ink">{t.subject}</h2>
              <span className="font-mono text-[10px] text-steel uppercase">
                {ROTULO_TICKET[t.status] ?? t.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-steel">
              {t.customerName} · {t.customerEmail} · {ROTULO_CATEGORIA_TICKET[t.category] ?? t.category}
              {t.pedidoReferencia ? ` · ${t.pedidoReferencia}` : ''}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-ink">
              <span className="text-steel">{t.lastFrom === 'cliente' ? 'Cliente: ' : 'Tu: '}</span>
              {t.lastMessage}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
