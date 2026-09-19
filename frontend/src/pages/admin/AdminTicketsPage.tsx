import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { ErroBloco } from '../../ui/ErroBloco';
import { ROTULO_TICKET } from '../../utils/format';

export function AdminTicketsPage() {
  const { avisar } = useAvisos();
  useTitulo('Suporte');
  const [tickets, setTickets] = useState<
    {
      id: string;
      category: string;
      subject: string;
      description: string;
      status: string;
      priority: string;
      createdAt: string;
      customerName: string;
      customerEmail: string;
    }[]
  >([]);
  const [erro, setErro] = useState('');

  async function carregar() {
    setErro('');
    const r = await api.adminTickets();
    setTickets(r.tickets);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar os pedidos de ajuda.'));
  }, []);

  async function mudarEstado(id: string, status: string) {
    try {
      await api.adminActualizarTicket(id, status);
      await carregar();
      avisar(`Pedido marcado como ${ROTULO_TICKET[status] ?? status}.`);
    } catch {
      setErro('Não foi possível actualizar o pedido de ajuda.');
    }
  }

  return (
    <div>
      <p className="label-mono">Suporte</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">Pedidos de ajuda</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        Mensagens abertas pelos clientes. Altera o estado quando responderes.
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-panel">
        {tickets.length === 0 && (
          <p className="p-6 font-mono text-[11px] text-steel">Não há pedidos de ajuda.</p>
        )}
        {tickets.map((t) => (
          <article key={t.id} className="border-b border-line p-4 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-white">{t.subject}</h2>
              <label className="font-mono text-[10px] text-steel uppercase">
                Estado
                <select
                  value={t.status}
                  onChange={(e) => void mudarEstado(t.id, e.target.value)}
                  className="ml-2 h-8 rounded-md border border-line bg-panel2 px-2 font-mono text-[10px] text-zinc-200"
                  aria-label={`Estado de ${t.subject}`}
                >
                  {Object.entries(ROTULO_TICKET).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-1 font-mono text-[11px] text-steel">
              {t.customerName} · {t.customerEmail} · {t.category}
            </p>
            <p className="mt-2 text-sm text-zinc-300">{t.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
