import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api, type Order } from '../api/client';
import { LOJA } from '../config/loja';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { useConfirmar } from '../ui/Confirmar';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro, ROTULO_ESTADO, ROTULO_PAGAMENTO } from '../utils/format';
import { useSession } from '../auth/SessionContext';
import { eAdmin } from '../auth/papeis';

export function PedidoPage() {
  const { referencia = '' } = useParams();
  const { user } = useSession();
  const admin = eAdmin(user);
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  const [order, setOrder] = useState<Order | null>(null);
  const [erro, setErro] = useState('');
  const [aPagar, setAPagar] = useState(false);
  const [modoPagamento, setModoPagamento] = useState<'demo' | 'producao'>('demo');
  const [iban, setIban] = useState<string | null>(null);
  useTitulo(order?.reference ?? 'Encomenda');

  async function carregar() {
    const r = await api.pedido(referencia);
    setOrder(r.order);
  }

  useEffect(() => {
    void carregar().catch((err) => {
      setErro(err instanceof ApiError ? err.message : 'Pedido não encontrado.');
    });
    void api
      .loja()
      .then((r) => {
        setModoPagamento(r.paymentMode);
        setIban(r.iban);
      })
      .catch(() => undefined);
  }, [referencia]);

  async function confirmarPagamento() {
    const ok = await confirmar({
      titulo: 'Confirmar pagamento?',
      mensagem: 'Isto marca a encomenda como paga nesta demonstração. Nenhum valor é cobrado.',
      confirmarLabel: 'Sim, confirmar',
    });
    if (!ok) return;
    setAPagar(true);
    setErro('');
    try {
      const r = await api.pagarPedido(referencia);
      setOrder(r.order);
      avisar('Pagamento confirmado.');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível confirmar o pagamento.');
    } finally {
      setAPagar(false);
    }
  }

  if (erro && !order) {
    return (
      <StoreShell>
        <div className="mt-16 max-w-lg">
          <ErroBloco
            titulo="Encomenda não encontrada"
            mensagem={erro}
            extra={
              <>
                <Link
                  to="/conta/pedidos"
                  className="grid h-10 place-items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-ink"
                >
                  Os meus pedidos
                </Link>
                <Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">
                  Ajuda
                </Link>
              </>
            }
          />
        </div>
      </StoreShell>
    );
  }

  if (!order) {
    return (
      <StoreShell>
        <p className="mt-16 text-center font-mono text-steel">A carregar pedido…</p>
      </StoreShell>
    );
  }

  const pendente = order.status === 'pendente';

  return (
    <StoreShell>
      <div className="mt-8 max-w-2xl">
        <p className="label-mono">Encomenda</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-white">{order.reference}</h1>
        <p className="mt-2 font-mono text-[11px] text-steel">
          {ROTULO_ESTADO[order.status] ?? order.status}
          {order.paidAt ? ` · pago ${new Date(order.paidAt).toLocaleString('pt-PT')}` : ''}
        </p>

        {pendente && !admin && (
          <section className="mt-6 rounded-[14px] border border-acid/40 bg-panel p-5">
            <h2 className="font-display text-white">Pagamento pendente</h2>
            {order.paymentMethod === 'multibanco' && (
              <dl className="mt-3 space-y-1 font-mono text-sm text-zinc-200">
                <div>Entidade {order.mbEntity ?? LOJA.nif.slice(0, 5)}</div>
                <div>Referência {order.mbReference ?? '—'}</div>
                <div>Montante {formatEuro(order.total)}</div>
              </dl>
            )}
            {order.paymentMethod === 'mbway' && (
              <p className="mt-2 text-sm text-zinc-400">
                Pedido {ROTULO_PAGAMENTO.mbway} enviado para {order.customer.phone}. Sem operador
                de pagamentos real nesta versão.
              </p>
            )}
            {order.paymentMethod === 'cartao' && (
              <div className="mt-2 text-sm text-zinc-400">
                <p>
                  {ROTULO_PAGAMENTO.cartao}
                  {iban ? ` para ${iban}` : ''}. Depois envia o comprovativo.
                </p>
                <label className="mt-3 block font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
                  Comprovativo
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block text-zinc-200"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void api
                        .enviarComprovativo(referencia, f)
                        .then((r) => {
                          setOrder(r.order);
                          avisar('Comprovativo enviado.');
                        })
                        .catch((err) =>
                          setErro(err instanceof ApiError ? err.message : 'Falha ao enviar comprovativo.'),
                        );
                    }}
                  />
                </label>
                {order.comprovativoUrl && (
                  <p className="mt-2 font-mono text-[11px] text-acid">Comprovativo recebido.</p>
                )}
              </div>
            )}
            {modoPagamento === 'demo' && (
              <button
                type="button"
                disabled={aPagar}
                onClick={() => void confirmarPagamento()}
                className="mt-4 h-11 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-ink disabled:opacity-60"
              >
                {aPagar ? 'A confirmar…' : 'Confirmar pagamento'}
              </button>
            )}
          </section>
        )}

        <section className="mt-6 rounded-[14px] border border-line bg-panel p-5">
          <div className="label-mono mb-3">Artigos</div>
          {order.items.map((i) => (
            <div key={i.sku + i.variant} className="flex justify-between py-2 font-mono text-[12px]">
              <span className="text-steel">
                {i.quantity}× {i.name} ({i.variant})
              </span>
              <span className="text-zinc-200">{formatEuro(i.total)}</span>
            </div>
          ))}
          <dl className="mt-3 space-y-1 border-t border-line pt-3 font-mono text-[11px] text-steel">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatEuro(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt>Cupão {order.couponCode}</dt>
                <dd>−{formatEuro(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Envio</dt>
              <dd>{order.shipping === 0 ? 'Grátis' : formatEuro(order.shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>IVA incluído</dt>
              <dd>{formatEuro(order.vat)}</dd>
            </div>
            <div className="flex justify-between font-display text-base text-white">
              <dt>Total</dt>
              <dd>{formatEuro(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-[14px] border border-line bg-panel p-5 font-mono text-[12px] text-steel">
          <div className="label-mono mb-3 text-zinc-200">Factura / entrega</div>
          <p>{order.customer.name}</p>
          <p>{order.customer.email}</p>
          <p>{order.customer.phone}</p>
          <p className="mt-2">
            {order.customer.address}
            <br />
            {order.customer.postalCode} {order.customer.city}
          </p>
          {order.nif && <p className="mt-2">NIF cliente {order.nif}</p>}
          <p className="mt-3">
            Emitido por {LOJA.nomeLegal} · NIF {LOJA.nif}
          </p>
          {order.tracking && <p className="mt-2 text-acid">Tracking {order.tracking}</p>}
          <p className="mt-4 text-[10px]">
            Guarda esta página — não há email transaccional ligado. Quem tiver a referência vê os
            dados da encomenda.
          </p>
        </section>

        {erro && (
          <div className="mt-4" role="alert">
            <p className="font-mono text-[11px] text-destructive">{erro}</p>
            <Link to="/ajuda" className="mt-1 inline-block font-mono text-[11px] text-acid">
              Ajuda
            </Link>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          {admin ? (
            <Link to="/admin/pedidos" className="font-mono text-[11px] text-acid uppercase">
              Pedidos no painel
            </Link>
          ) : user ? (
            <Link to="/conta/pedidos" className="font-mono text-[11px] text-acid uppercase">
              Os meus pedidos
            </Link>
          ) : (
            <Link to="/login" className="font-mono text-[11px] text-acid uppercase">
              Criar conta para seguir entregas
            </Link>
          )}
          <Link
            to={`/pedido/${encodeURIComponent(order.reference)}/factura`}
            className="font-mono text-[11px] text-acid uppercase"
          >
            Factura
          </Link>
          <Link to="/catalogo" className="font-mono text-[11px] text-steel uppercase hover:text-acid">
            {admin ? 'Ver catálogo' : 'Continuar a comprar'}
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
