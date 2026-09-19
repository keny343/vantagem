import { Link } from 'react-router-dom';
import type { Product } from '../api/client';
import { useCart } from '../cart/CartContext';
import { formatEuro } from '../utils/format';

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const esgotado = product.stock === 0;
  const baixo = product.stock > 0 && product.stock <= 5;

  return (
    <article className="group overflow-hidden rounded-[14px] border border-line bg-panel transition-all duration-300 hover:-translate-y-1 hover:border-acid/40 hover:shadow-[0_20px_50px_-24px_rgba(201,242,74,0.35)]">
      <Link to={`/produto/${product.id}`} className="relative block">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={832}
          className="aspect-[5/4] w-full bg-panel2 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded bg-acid px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-ink uppercase">
            {product.badge}
          </span>
        )}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="glass rounded-lg border border-line px-3 py-2 font-mono text-[10px] leading-relaxed text-zinc-300">
            {product.specs.slice(0, 3).join(' · ')}
          </div>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="label-mono">{product.brand}</div>
            <h3 className="mt-1 font-display font-medium text-white">
              <Link to={`/produto/${product.id}`} className="hover:text-acid">
                {product.name}
              </Link>
            </h3>
          </div>
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
              esgotado
                ? 'border-line text-steel'
                : baixo
                  ? 'border-warn/40 text-warn'
                  : 'border-acid/40 text-acid'
            }`}
          >
            {esgotado ? 'Esgotado' : baixo ? `${product.stock} un.` : 'Stock'}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-white">
              {formatEuro(product.price)}
            </span>
            {product.oldPrice !== null && (
              <span className="font-mono text-[11px] text-steel line-through">
                {formatEuro(product.oldPrice)}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={esgotado}
            onClick={() =>
              cart.add({
                id: product.id,
                name: product.name,
                variant: product.variants.options[0] ?? 'Padrão',
                price: product.price,
                image: product.images[0] ?? '',
              })
            }
            className="h-9 rounded-md bg-acid px-3 font-mono text-[11px] tracking-[0.1em] text-ink uppercase transition-transform hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-panel2 disabled:text-steel"
          >
            {esgotado ? 'Indisponível' : '+ Carrinho'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-panel">
      <div className="skel aspect-[5/4] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skel h-3 w-16" />
        <div className="skel h-4 w-32" />
        <div className="skel mt-3 h-5 w-20" />
      </div>
    </div>
  );
}
