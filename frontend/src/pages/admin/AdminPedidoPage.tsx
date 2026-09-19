import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Order } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { Campo } from '../../ui/Campo';
import { useConfirmar } from '../../ui/Confirmar';
import { ErroBloco } from '../../ui/ErroBloco';
import { formatEuro, ROTULO_ESTADO } from '../../utils/format';

const ESTADOS = ['pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado'] as const;

export function AdminPedidoPage() {
  const { id = '' } = useParams();
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState('');
  const [erro, setErro] = useState('');
  useTitulo(order?.reference ?? 'Pedido');

  async function carregar() {
    const r = await api.adminPedido(id);
    setOrder(r.order);
    setTracking(r.order.tracking ?? '');
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Pedido não encontrado.'));
  }, [id]);

  async function mudar(status: string) {
    if (!order) return;
    if (status === 'cancelado') {
      const ok = await confirmar({
        titulo: 'Cancelar encomenda?',
        mensagem: 'Se ainda não saiu do armazém, o stock volta para o artigo.',
        confirmarLabel: 'Cancelar encomenda',
        perigo: true,
      });
      if (!ok) return;
    }
    setErro('');
    try {
      await api.adminEstado(order.id, status, tracking || undefined);
      avisar(`Pedido actualizado: ${ROTULO_ESTADO[status] ?? status}.`);
      await carregar();
    } catch {
      setErro('Não foi possível actualizar.');
    }
  }

  if (!order && erro) {
    return <ErroBloco titulo="Pedido não encontrado" mensagem={erro} extra={<Link to="/admin/pedidos" className="grid h-10 place-items-center font-mono text-[11px] text-acid">Voltar aos pedidos</Link>} />;
  }
  if (!order) {
    return <p className="font-mono text-steel">A carregar…</p>;
  }

  return (
    <div>
      <Link to="/admin/pedidos" className="font-mono text-[11px] text-steel hover:text-acid">
        ← Pedidos
      </Link>
      <p className="label-mono mt-4">Operações</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">{order.reference}</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        {ROTULO_ESTADO[order.status] ?? order.status} · {formatEuro(order.total)}
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} />
        </div>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[14px] border border-line bg-panel p-5">
          <div className="label-mono mb-3">Cliente</div>
          <p className="text-white">{order.customer.name}</p>
          <p className="font-mono text-[12px] text-steel">{order.customer.email}</p>
          <p className="font-mono text-[12px] text-steel">{order.customer.phone}</p>
          <p className="mt-3 font-mono text-[12px] text-zinc-300">
            {order.customer.address}
            <br />
            {order.customer.postalCode} {order.customer.city}
          </p>
          {order.nif && <p className="mt-2 font-mono text-[11px] text-steel">NIF {order.nif}</p>}
        </div>
        <div className="rounded-[14px] border border-line bg-panel p-5">
          <div className="label-mono mb-3">Artigos</div>
          {order.items.map((i) => (
            <div key={i.sku + i.variant} className="flex justify-between py-1 font-mono text-[12px]">
              <span className="text-steel">
                {i.quantity}× {i.name}
              </span>
              <span>{formatEuro(i.total)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-display text-white">
            <span>Total</span>
            <span>{formatEuro(order.total)}</span>
          </div>
          {order.couponCode && (
            <p className="mt-2 font-mono text-[11px] text-acid">
              Cupão {order.couponCode} (−{formatEuro(order.discount)})
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 space-y-3 rounded-[14px] border border-line bg-panel p-5">
        <div className="label-mono">Estado e tracking</div>
        <p className="font-mono text-[11px] text-steel">
          Cancelar devolve o stock se o pedido ainda não saiu do armazém.
        </p>
        <Campo
          id="tracking"
          label="Código de rastreio"
          hint="Número da transportadora. O cliente vê-o na página da encomenda."
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Ex.: AO123456789"
        />
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void mudar(s)}
              className={`h-9 rounded-md px-3 font-mono text-[10px] uppercase ${
                order.status === s ? 'bg-acid text-ink' : 'text-zinc-300 ring-1 ring-line'
              }`}
            >
              {ROTULO_ESTADO[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
