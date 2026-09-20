import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, urlMedia, type Order } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { useConfirmar } from '../../ui/Confirmar';
import { ErroBloco } from '../../ui/ErroBloco';
import { formatEuro, ROTULO_ESTADO, ROTULO_PAGAMENTO } from '../../utils/format';

const ESTADOS = ['pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado'] as const;

export function AdminPedidoPage() {
  const { id = '' } = useParams();
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  const [order, setOrder] = useState<Order | null>(null);
  const [erro, setErro] = useState('');
  const [aPagar, setAPagar] = useState(false);
  useTitulo(order?.reference ?? 'Pedido');

  async function carregar() {
    const r = await api.adminPedido(id);
    setOrder(r.order);
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
      await api.adminEstado(order.id, status);
      avisar(`Pedido actualizado: ${ROTULO_ESTADO[status] ?? status}.`);
      await carregar();
    } catch {
      setErro('Não foi possível actualizar.');
    }
  }

  async function marcarPago() {
    if (!order) return;
    const ok = await confirmar({
      titulo: 'Marcar como pago?',
      mensagem: order.comprovativoUrl
        ? `Confirmas que o comprovativo corresponde a ${formatEuro(order.total)}?`
        : `Ainda não há fotografia do comprovativo. Queres mesmo marcar ${formatEuro(order.total)} como pago?`,
      confirmarLabel: 'Sim, está pago',
    });
    if (!ok) return;
    setAPagar(true);
    setErro('');
    try {
      await api.adminEstado(order.id, 'pago');
      avisar('Encomenda marcada como paga.');
      await carregar();
    } catch {
      setErro('Não foi possível marcar como pago.');
    } finally {
      setAPagar(false);
    }
  }

  if (!order && erro) {
    return (
      <ErroBloco
        titulo="Pedido não encontrado"
        mensagem={erro}
        extra={
          <Link to="/admin/pedidos" className="grid h-10 place-items-center font-mono text-[11px] text-acid">
            Voltar aos pedidos
          </Link>
        }
      />
    );
  }
  if (!order) {
    return <p className="font-mono text-steel">A carregar…</p>;
  }

  return (
    <div>
      <Link to="/admin/pedidos" className="font-mono text-[11px] text-steel hover:text-acid">
        ? Pedidos
      </Link>
      <p className="label-mono mt-4">Operações</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{order.reference}</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        {ROTULO_ESTADO[order.status] ?? order.status} · {formatEuro(order.total)} ·{' '}
        {ROTULO_PAGAMENTO[order.paymentMethod] ?? order.paymentMethod}
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} />
        </div>
      )}

      {order.status === 'pendente' && (
        <section className="mt-6 rounded-[14px] border border-acid/40 bg-panel p-5">
          <div className="label-mono mb-3">Comprovativo de transferência</div>
          {order.comprovativoUrl ? (
            <>
              <a href={urlMedia(order.comprovativoUrl)} target="_blank" rel="noreferrer">
                <img
                  src={urlMedia(order.comprovativoUrl)}
                  alt="Comprovativo de pagamento"
                  className="max-h-80 rounded-lg border border-line object-contain"
                />
              </a>
              <p className="mt-2 font-mono text-[11px] text-steel">Clica na imagem para abrir em tamanho real.</p>
            </>
          ) : (
            <p className="text-sm text-steel">O cliente ainda não enviou a fotografia do comprovativo.</p>
          )}
          <button
            type="button"
            disabled={aPagar}
            onClick={() => void marcarPago()}
            className="mt-4 h-11 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas disabled:opacity-60"
          >
            {aPagar ? 'A marcar…' : 'Marcar como pago'}
          </button>
        </section>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[14px] border border-line bg-panel p-5">
          <div className="label-mono mb-3">Cliente</div>
          <p className="text-ink">{order.customer.name}</p>
          <p className="font-mono text-[12px] text-steel">{order.customer.email}</p>
          <p className="font-mono text-[12px] text-steel">{order.customer.phone}</p>
          <p className="mt-3 font-mono text-[12px] text-ink/70">
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
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-display text-ink">
            <span>Total</span>
            <span>{formatEuro(order.total)}</span>
          </div>
          {order.couponCode && (
            <p className="mt-2 font-mono text-[11px] text-acid">
              Cupão {order.couponCode} (-{formatEuro(order.discount)})
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 space-y-3 rounded-[14px] border border-line bg-panel p-5">
        <div className="label-mono">Estado da encomenda</div>
        <p className="font-mono text-[11px] text-steel">
          Depois de pago: preparação ? enviado ? entregue. O cliente vê o mesmo estado na conta. A loja
          não gera códigos de rastreio — a entrega é tratada fora do sistema.
        </p>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void mudar(s)}
              className={`h-9 rounded-md px-3 font-mono text-[10px] uppercase ${
                order.status === s ? 'bg-acid text-canvas' : 'text-canvas/70 ring-1 ring-line'
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
