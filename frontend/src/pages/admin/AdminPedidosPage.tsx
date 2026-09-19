import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { useConfirmar } from '../../ui/Confirmar';
import { ErroBloco } from '../../ui/ErroBloco';
import { formatEuro, ROTULO_ESTADO } from '../../utils/format';

const ESTADOS = ['pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado'] as const;

export function AdminPedidosPage() {
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  useTitulo('Pedidos');
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
  const [erro, setErro] = useState('');

  async function carregar() {
    setErro('');
    const r = await api.adminPedidos();
    setOrders(r.orders);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar os pedidos.'));
  }, []);

  async function mudarEstado(id: string, status: string) {
    if (status === 'cancelado') {
      const ok = await confirmar({
        titulo: 'Cancelar encomenda?',
        mensagem: 'Se ainda não saiu do armazém, o stock volta para o artigo.',
        confirmarLabel: 'Cancelar encomenda',
        perigo: true,
      });
      if (!ok) {
        await carregar();
        return;
      }
    }
    try {
      await api.adminEstado(id, status);
      avisar(`Pedido actualizado: ${ROTULO_ESTADO[status] ?? status}.`);
      await carregar();
    } catch {
      setErro('Não foi possível actualizar o pedido.');
      await carregar();
    }
  }

  return (
    <div>
      <p className="label-mono">Operações</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">Pedidos</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        Avança o estado: aguardar pagamento → pago → preparação → enviado → entregue.
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}

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
              <Link to={`/admin/pedidos/${o.id}`} className="font-mono text-[11px] text-acid hover:underline">
                {o.reference}
              </Link>
              <div className="font-display text-white">{o.customerName}</div>
              <div className="font-mono text-[10px] text-steel">{o.customerEmail}</div>
            </div>
            <div className="font-display text-white">{formatEuro(o.total)}</div>
            <label className="font-mono text-[10px] text-steel uppercase">
              Estado
              <select
                value={o.status}
                onChange={(e) => void mudarEstado(o.id, e.target.value)}
                className="ml-2 h-9 rounded-md border border-line bg-panel2 px-2 font-mono text-[11px] text-zinc-200"
                aria-label={`Estado de ${o.reference}`}
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {ROTULO_ESTADO[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
