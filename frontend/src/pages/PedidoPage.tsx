import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, mensagemParaUtilizador, urlMedia, type Order } from '../api/client';
import { LOJA } from '../config/loja';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { CampoComprovativo, validarComprovativo } from '../ui/CampoComprovativo';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro, ROTULO_PAGAMENTO, estadoEncomenda } from '../utils/format';
import { useSession } from '../auth/SessionContext';
import { eAdmin } from '../auth/papeis';

export function PedidoPage() {
  const { referencia = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  const admin = eAdmin(user);
  const { avisar } = useAvisos();
  const [order, setOrder] = useState<Order | null>(null);
  const [erro, setErro] = useState(
    typeof (location.state as { aviso?: string } | null)?.aviso === 'string'
      ? (location.state as { aviso: string }).aviso
      : '',
  );
  const [iban, setIban] = useState<string | null>(null);
  const [aFalar, setAFalar] = useState(false);
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [aEnviarFoto, setAEnviarFoto] = useState(false);
  useTitulo(order?.reference ?? 'Encomenda');

  async function carregar() {
    const r = await api.pedido(referencia);
    setOrder(r.order);
  }

  useEffect(() => {
    void carregar().catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        void navigate(`/login?seguir=${encodeURIComponent(`/pedido/${referencia}`)}`);
        return;
      }
      setErro(
        err instanceof ApiError
          ? mensagemParaUtilizador(err, 'Pedido não encontrado.')
          : 'Pedido não encontrado.',
      );
    });
    void api
      .loja()
      .then((r) => setIban(r.iban))
      .catch(() => undefined);
  }, [referencia, navigate]);

  async function falarComLoja() {
    if (!order) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setAFalar(true);
    setErro('');
    try {
      const categoria =
        order.status === 'pendente'
          ? 'pagamento'
          : order.status === 'enviado' || order.status === 'entregue'
            ? 'entrega'
            : 'pedido';
      const r = await api.criarTicket({
        categoria,
        assunto: `Encomenda ${order.reference}`,
        descricao: `Olá, preciso de ajuda com a encomenda ${order.reference}.`,
        pedidoReferencia: order.reference,
      });
      navigate(`/conta/suporte/${r.ticket.id}`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível abrir a conversa.');
    } finally {
      setAFalar(false);
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
                  className="grid h-10 place-items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
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
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{order.reference}</h1>
        <p className="mt-2 font-mono text-[11px] text-steel">
          {estadoEncomenda(order)}
          {order.paidAt ? ` · ${new Date(order.paidAt).toLocaleString('pt-PT')}` : ''}
        </p>

        {pendente && !admin && order.comprovativoUrl && (
          <section className="mt-6 rounded-[14px] border border-acid/40 bg-panel p-5">
            <h2 className="font-display text-ink">Comprovativo recebido</h2>
            <p className="mt-2 text-sm text-zinc-400">
              A loja está a verificar a transferência. Quando confirmar, o estado passa a pago —
              acompanhas isso na tua conta, em Os meus pedidos.
            </p>
            <img
              src={urlMedia(order.comprovativoUrl)}
              alt="Comprovativo enviado"
              className="mt-4 max-h-56 rounded-lg border border-line object-contain"
            />
            <Link
              to="/conta/pedidos"
              className="mt-4 inline-grid h-11 place-items-center rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas"
            >
              Acompanhar na tua conta
            </Link>
          </section>
        )}

        {order.status === 'pago' && !admin && (
          <section className="mt-6 rounded-[14px] border border-acid/40 bg-panel p-5">
            <h2 className="font-display text-ink">Pagamento confirmado</h2>
            <p className="mt-2 text-sm text-zinc-400">
              A loja verificou o comprovativo e marcou a encomenda como paga.
            </p>
            <Link
              to="/conta/pedidos"
              className="mt-4 inline-grid h-11 place-items-center rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas"
            >
              Ver na tua conta
            </Link>
          </section>
        )}

        {pendente && !admin && !order.comprovativoUrl && (
          <section className="mt-6 rounded-[14px] border border-acid/40 bg-panel p-5">
            <h2 className="font-display text-ink">Envia o comprovativo</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Transfere o valor e anexa a fotografia. Só a loja marca a encomenda como paga.
            </p>
            <div className="mt-3 rounded-lg border border-line bg-panel2 p-3 font-mono text-sm text-ink/80">
              <div>Método {ROTULO_PAGAMENTO.cartao}</div>
              {iban ? <div className="mt-1 break-all">IBAN {iban}</div> : (
                <div className="mt-1 text-steel">
                  Os dados da conta aparecem aqui quando a loja os configurar.
                </div>
              )}
              <div className="mt-1">Montante {formatEuro(order.total)}</div>
            </div>
            <div className="mt-4">
              <CampoComprovativo
                id="pedido-comprovativo"
                ficheiro={ficheiro}
                required
                aEnviar={aEnviarFoto}
                erro={erro}
                onChange={(f) => {
                  setErro('');
                  if (!f) {
                    setFicheiro(null);
                    return;
                  }
                  const invalido = validarComprovativo(f);
                  if (invalido) {
                    setFicheiro(null);
                    setErro(invalido);
                    return;
                  }
                  setFicheiro(f);
                  setAEnviarFoto(true);
                  void api
                    .enviarComprovativo(referencia, f)
                    .then((r) => {
                      setOrder(r.order);
                      setErro('');
                      avisar('Comprovativo enviado. A loja vai verificar.');
                    })
                    .catch((err) =>
                      setErro(
                        mensagemParaUtilizador(
                          err,
                          'Não foi possível enviar a fotografia. Tenta outra vez.',
                        ),
                      ),
                    )
                    .finally(() => setAEnviarFoto(false));
                }}
              />
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[14px] border border-line bg-panel p-5">
          <div className="label-mono mb-3">Artigos</div>
          {order.items.map((i) => (
            <div key={i.sku + i.variant} className="flex justify-between py-2 font-mono text-[12px]">
              <span className="text-steel">
                {i.quantity}× {i.name} ({i.variant})
              </span>
              <span className="text-ink/80">{formatEuro(i.total)}</span>
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
            <div className="flex justify-between font-display text-base text-ink">
              <dt>Total</dt>
              <dd>{formatEuro(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-[14px] border border-line bg-panel p-5 font-mono text-[12px] text-steel">
          <div className="label-mono mb-3 text-ink/80">Factura / entrega</div>
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
        </section>

        {erro && (
          <div className="mt-4" role="alert">
            <p className="font-mono text-[11px] text-destructive">{erro}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          {admin ? (
            <Link to="/admin/pedidos" className="font-mono text-[11px] text-acid uppercase">
              Pedidos no painel
            </Link>
          ) : (
            <button
              type="button"
              disabled={aFalar}
              onClick={() => void falarComLoja()}
              className="font-mono text-[11px] text-acid uppercase disabled:opacity-60"
            >
              {aFalar ? 'A abrir…' : 'Falar com a loja'}
            </button>
          )}
          {user && !admin ? (
            <Link to="/conta/pedidos" className="font-mono text-[11px] text-acid uppercase">
              Os meus pedidos
            </Link>
          ) : !user ? (
            <Link to="/login" className="font-mono text-[11px] text-acid uppercase">
              Entrar para falar com a loja
            </Link>
          ) : null}
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
