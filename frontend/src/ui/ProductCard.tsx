import { Link } from 'react-router-dom';
import type { Product } from '../api/client';
import { urlMedia } from '../api/client';
import { eAdmin } from '../auth/papeis';
import { useSession } from '../auth/SessionContext';
import { useAdicionarAoCarrinho } from '../cart/useAdicionarAoCarrinho';
import { formatEuro } from '../utils/format';

export function ProductCard({ product }: { product: Product }) {
  const adicionar = useAdicionarAoCarrinho();
  const { user } = useSession();
  const admin = eAdmin(user);
  const esgotado = product.stock === 0;
  const baixo = product.stock > 0 && product.stock <= 5;

  return (
    <article className="group overflow-hidden border border-line bg-panel transition-colors hover:border-acid/50">
      <Link to={`/produto/${product.id}`} className="relative block">
        <img
          src={urlMedia(product.images[0])}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={832}
          className="aspect-[5/4] w-full bg-panel2 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {product.hero && (
          <span className="absolute top-3 left-3 bg-acid px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-canvas uppercase">
            Capa
          </span>
        )}
        {!product.hero && product.badge && (
          <span className="absolute top-3 left-3 bg-ink px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-canvas uppercase">
            {product.badge}
          </span>
        )}
        {product.specs.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="rounded-md border border-line bg-canvas/95 px-3 py-2 font-mono text-[10px] leading-relaxed text-ink/70">
              {product.specs.slice(0, 3).join(' · ')}
            </div>
          </div>
        )}
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="label-mono">{product.brand}</div>
            <h3 className="mt-1 font-display font-medium text-ink">
              <Link to={`/produto/${product.id}`} className="hover:text-acid">
                {product.name}
              </Link>
            </h3>
          </div>
          <span
            className={`border px-1.5 py-0.5 font-mono text-[10px] ${
              esgotado
                ? 'border-line text-steel'
                : baixo
                  ? 'border-warn/40 text-warn'
                  : 'border-acid/40 text-acid'
            }`}
          >
            {esgotado ? 'Esgotado' : baixo ? 'Poucas un.' : 'Disponível'}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-ink">
              {formatEuro(product.price)}
            </span>
            {product.oldPrice !== null && (
              <span className="font-mono text-[11px] text-steel line-through">
                {formatEuro(product.oldPrice)}
              </span>
            )}
          </div>
          {admin ? (
            <Link
              to={`/produto/${product.id}`}
              className="grid h-9 place-items-center rounded-md px-3 font-mono text-[11px] tracking-[0.1em] text-ink/70 uppercase ring-1 ring-line hover:text-acid"
            >
              Ver
            </Link>
          ) : (
            <button
              type="button"
              disabled={esgotado}
              onClick={() => {
                adicionar({
                  id: product.id,
                  name: product.name,
                  variant: product.variants.options[0] ?? 'Padrão',
                  price: product.price,
                  image: product.images[0] ?? '',
                  stock: product.stock,
                });
              }}
              className="h-9 rounded-md bg-acid px-3 font-mono text-[11px] tracking-[0.1em] text-canvas uppercase transition-transform hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-panel2 disabled:text-steel"
            >
              {esgotado ? 'Indisponível' : user ? '+ Carrinho' : 'Entrar para comprar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden border border-line bg-panel">
      <div className="skel aspect-[5/4] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skel h-3 w-16" />
        <div className="skel h-4 w-32" />
        <div className="skel mt-3 h-5 w-20" />
      </div>
    </div>
  );
}
