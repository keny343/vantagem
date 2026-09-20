import { Link } from 'react-router-dom';
import { urlMedia } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useSession } from '../auth/SessionContext';
import { LOJA, faltaParaEnvioGratis, ivaIncluidoDe } from '../config/loja';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { formatEuro } from '../utils/format';

export function CarrinhoPage() {
  const cart = useCart();
  const { user } = useSession();
  const { avisar } = useAvisos();
  useTitulo('Carrinho');

  function retirar(id: string, variant: string) {
    cart.remove(id, variant);
    avisar('Artigo retirado do carrinho.', {
      tipo: 'info',
      acao: { label: 'Anular', onClick: () => cart.desfazer() },
    });
  }

  return (
    <StoreShell>
      <h1 className="mt-8 font-display text-2xl font-semibold text-ink">Carrinho</h1>
      <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-steel uppercase">
        {cart.count} artigos
      </p>

      {cart.lines.length === 0 ? (
        <div className="mt-6 rounded-[14px] border border-line bg-panel p-10 text-center">
          <p className="font-display text-lg text-ink">O carrinho está vazio</p>
          <Link
            to="/catalogo"
            className="mt-4 inline-grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-canvas"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="overflow-hidden rounded-[14px] border border-line bg-panel">
            {cart.lines.map((line) => (
              <div
                key={line.id + line.variant}
                className="flex items-center gap-4 border-b border-line p-4 last:border-b-0"
              >
                <img
                  src={urlMedia(line.image)}
                  alt={line.name}
                  className="size-20 rounded-lg border border-line object-cover"
                />
                <div className="flex-1">
                  <Link to={`/produto/${line.id}`} className="font-display text-ink hover:text-acid">
                    {line.name}
                  </Link>
                  <div className="mt-0.5 font-mono text-[10px] text-steel">{line.variant}</div>
                </div>
                <div className="flex h-9 items-center rounded-md border border-line">
                  <button
                    type="button"
                    onClick={() =>
                      line.qty <= 1
                        ? retirar(line.id, line.variant)
                        : cart.setQty(line.id, line.variant, line.qty - 1)
                    }
                    className="px-2.5 font-mono text-xs text-steel hover:text-acid"
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <span className="min-w-7 text-center font-mono text-xs text-ink">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => cart.setQty(line.id, line.variant, line.qty + 1)}
                    className="px-2.5 font-mono text-xs text-steel hover:text-acid"
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>
                <div className="w-24 text-right font-display text-ink">
                  {formatEuro(line.price * line.qty)}
                </div>
                <button
                  type="button"
                  onClick={() => retirar(line.id, line.variant)}
                  className="font-mono text-[10px] tracking-[0.1em] text-steel uppercase hover:text-destructive"
                  aria-label={`Retirar ${line.name}`}
                >
                  Retirar
                </button>
              </div>
            ))}
          </div>
          <aside className="self-start rounded-[14px] border border-line bg-panel p-5">
            <div className="label-mono mb-4">Resumo</div>
            <dl className="space-y-2 font-mono text-[12px] text-steel">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-ink/80">{formatEuro(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Envio</dt>
                <dd className="text-ink/80">
                  {cart.shipping === 0 ? 'Grátis' : formatEuro(cart.shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>IVA incluído</dt>
                <dd className="text-ink/80">{formatEuro(ivaIncluidoDe(cart.total))}</dd>
              </div>
            </dl>
            {faltaParaEnvioGratis(cart.subtotal) > 0 && (
              <p className="mt-3 font-mono text-[10px] text-steel">
                Faltam {formatEuro(faltaParaEnvioGratis(cart.subtotal))} para envio grátis.
              </p>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-display text-lg text-ink">
              <span>Total</span>
              <span>{formatEuro(cart.total)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-4 grid h-11 place-items-center rounded-lg bg-acid font-display text-sm font-semibold text-canvas hover:brightness-105"
            >
              Finalizar compra
            </Link>
            <Link
              to="/catalogo"
              className="mt-2 block text-center font-mono text-[10px] text-steel uppercase hover:text-acid"
            >
              Continuar a ver artigos
            </Link>
            <p className="mt-2 text-center font-mono text-[10px] text-steel">
              {user
                ? `IVA ${Math.round(LOJA.taxaIva * 100)}% incluído · Envio em Angola`
                : 'Para concluir precisas de entrar ou criar conta.'}
            </p>
          </aside>
        </div>
      )}
    </StoreShell>
  );
}
