import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, urlMedia } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { useConfirmar } from '../../ui/Confirmar';
import { ErroBloco } from '../../ui/ErroBloco';
import { formatEuro, estadoEncomenda, ROTULO_ESTADO, ROTULO_PAGAMENTO } from '../../utils/format';

const ESTADOS = ['pendente', 'pago', 'em_preparacao', 'enviado', 'entregue', 'cancelado'] as const;

type PedidoLista = {
  id: string;
  reference: string;
  status: string;
  customerName: string;
  customerEmail: string;
  total: number;
  createdAt: string;
  paymentMethod: string;
  hasProof: boolean;
  comprovativoUrl: string | null;
};

export function AdminPedidosPage() {
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  const [params] = useSearchParams();
  useTitulo('Pedidos');
  const [orders, setOrders] = useState<PedidoLista[]>([]);
  const [erro, setErro] = useState('');
  const [aConfirmar, setAConfirmar] = useState<string | null>(null);

  async function carregar() {
    setErro('');
    const r = await api.adminPedidos();
    setOrders(r.orders);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar os pedidos.'));
  }, []);

  const porVerificar = useMemo(
    () => orders.filter((o) => o.status === 'pendente' && o.hasProof),
    [orders],
  );
  const restantes = useMemo(
    () => orders.filter((o) => !(o.status === 'pendente' && o.hasProof)),
    [orders],
  );

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

  async function confirmarPagamento(o: PedidoLista) {
    const ok = await confirmar({
      titulo: 'Confirmar pagamento?',
      mensagem: `Confirmas que o comprovativo de ${o.customerName} corresponde a ${formatEuro(o.total)}? O cliente vê «Pago» na conta.`,
      confirmarLabel: 'Sim, pagamento confirmado',
    });
    if (!ok) return;
    setAConfirmar(o.id);
    setErro('');
    try {
      await api.adminEstado(o.id, 'pago');
      avisar('Pagamento confirmado. O cliente já vê o estado actualizado.');
      await carregar();
    } catch {
      setErro('Não foi possível confirmar o pagamento.');
    } finally {
      setAConfirmar(null);
    }
  }

  const destacarVerificacao = params.get('filtro') === 'comprovativos';

  return (
    <div>
      <p className="label-mono">Operações</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">Pedidos</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        Verifica o comprovativo e confirma o pagamento — o cliente vê o mesmo estado na conta.
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}

      <section
        className={`mt-6 rounded-[14px] border p-5 ${
          destacarVerificacao || porVerificar.length > 0
            ? 'border-acid/50 bg-panel'
            : 'border-line bg-panel'
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg text-white">Pagamentos por verificar</h2>
            <p className="mt-1 font-mono text-[11px] text-steel">
              Comprovativo recebido — confirma aqui depois de ver a fotografia.
            </p>
          </div>
          <span className="font-mono text-[11px] text-acid">
            {porVerificar.length}{' '}
            {porVerificar.length === 1 ? 'encomenda' : 'encomendas'}
          </span>
        </div>

        {porVerificar.length === 0 ? (
          <p className="mt-4 font-mono text-[11px] text-steel">
            Não há comprovativos à espera. Quando o cliente enviar a foto, aparece aqui.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {porVerificar.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap gap-4 rounded-lg border border-acid/30 bg-panel2 p-4"
              >
                {o.comprovativoUrl ? (
                  <a
                    href={urlMedia(o.comprovativoUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <img
                      src={urlMedia(o.comprovativoUrl)}
                      alt={`Comprovativo ${o.reference}`}
                      className="h-28 w-28 rounded-md border border-line object-cover"
                    />
                  </a>
                ) : null}
                <div className="min-w-[180px] flex-1">
                  <Link
                    to={`/admin/pedidos/${o.id}`}
                    className="font-mono text-[11px] text-acid hover:underline"
                  >
                    {o.reference}
                  </Link>
                  <div className="font-display text-white">{o.customerName}</div>
                  <div className="font-mono text-[10px] text-steel">{o.customerEmail}</div>
                  <div className="mt-2 font-display text-white">{formatEuro(o.total)}</div>
                  <div className="font-mono text-[10px] text-steel">
                    {ROTULO_PAGAMENTO[o.paymentMethod] ?? o.paymentMethod}
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <button
                    type="button"
                    disabled={aConfirmar === o.id}
                    onClick={() => void confirmarPagamento(o)}
                    className="h-11 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-ink disabled:opacity-60"
                  >
                    {aConfirmar === o.id ? 'A confirmar…' : 'Confirmar pagamento'}
                  </button>
                  <Link
                    to={`/admin/pedidos/${o.id}`}
                    className="grid h-10 place-items-center font-mono text-[11px] text-acid uppercase"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 className="mt-8 font-display text-lg text-white">Todos os pedidos</h2>
      <div className="mt-3 overflow-hidden rounded-[14px] border border-line bg-panel">
        {orders.length === 0 && (
          <p className="p-6 font-mono text-[11px] text-steel">Ainda não há pedidos.</p>
        )}
        {restantes.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-b-0"
          >
            <div className="min-w-[160px] flex-1">
              <Link
                to={`/admin/pedidos/${o.id}`}
                className="font-mono text-[11px] text-acid hover:underline"
              >
                {o.reference}
              </Link>
              <div className="font-display text-white">{o.customerName}</div>
              <div className="font-mono text-[10px] text-steel">{o.customerEmail}</div>
              {o.status === 'pendente' && !o.hasProof && (
                <div className="mt-1 font-mono text-[10px] text-steel uppercase">
                  À espera do comprovativo
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-display text-white">{formatEuro(o.total)}</div>
              <div className="font-mono text-[10px] text-steel">
                {ROTULO_PAGAMENTO[o.paymentMethod] ?? o.paymentMethod}
              </div>
              <div className="mt-1 font-mono text-[10px] text-acid">
                {estadoEncomenda({ status: o.status, comprovativoUrl: o.comprovativoUrl })}
              </div>
            </div>
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
