import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Product } from '../api/client';
import { useCart } from '../cart/CartContext';
import { StoreShell } from '../layout/StoreShell';
import { ProductCard } from '../ui/ProductCard';
import { formatEuro } from '../utils/format';

export function ProdutoPage() {
  const { id = '' } = useParams();
  const cart = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [variant, setVariant] = useState('');
  const [qty, setQty] = useState(1);
  const [erro, setErro] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.produto(id);
        setProduct(res.product);
        setRelated(res.related);
        setVariant(res.product.variants.options[0] ?? 'Padrão');
        setErro('');
      } catch {
        setErro('Produto não encontrado.');
        setProduct(null);
      }
    })();
  }, [id]);

  if (erro) {
    return (
      <StoreShell>
        <div className="mt-20 text-center">
          <h1 className="font-display text-4xl text-white">404</h1>
          <p className="mt-2 text-steel">{erro}</p>
          <Link to="/catalogo" className="mt-6 inline-grid h-11 place-items-center rounded-full bg-acid px-6 font-display text-sm font-semibold text-ink">
            Ver catálogo
          </Link>
        </div>
      </StoreShell>
    );
  }

  if (!product) {
    return (
      <StoreShell>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="skel aspect-square rounded-[14px]" />
          <div className="space-y-3">
            <div className="skel h-4 w-24" />
            <div className="skel h-8 w-64" />
            <div className="skel h-6 w-32" />
          </div>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <div className="mt-6 font-mono text-[11px] tracking-[0.12em] text-steel uppercase">
        <Link to="/catalogo" className="hover:text-acid">
          Catálogo
        </Link>
        <span> / </span>
        <Link to={`/catalogo?categoria=${encodeURIComponent(product.category)}`} className="hover:text-acid">
          {product.category}
        </Link>
        <span> / </span>
        <span className="text-zinc-300">{product.sku}</span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[14px] border border-line bg-panel">
          <img
            src={product.images[0]}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div>
          <div className="label-mono">{product.brand}</div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white">{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-2xl text-white">{formatEuro(product.price)}</span>
            <span className="font-mono text-[11px] text-steel">{product.stock} em stock</span>
          </div>
          <p className="mt-4 max-w-[48ch] text-zinc-400">{product.description}</p>

          <div className="mt-6">
            <div className="label-mono mb-2">{product.variants.label}</div>
            <div className="flex flex-wrap gap-2">
              {product.variants.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVariant(opt)}
                  className={`h-9 rounded-md px-3 font-mono text-[11px] ${
                    variant === opt
                      ? 'bg-acid text-ink'
                      : 'text-zinc-300 ring-1 ring-line hover:text-acid'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 items-center rounded-lg border border-line">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 font-mono text-steel hover:text-acid"
              >
                −
              </button>
              <span className="min-w-8 text-center font-mono text-sm text-white">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 font-mono text-steel hover:text-acid"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={product.stock === 0}
              onClick={() =>
                cart.add(
                  {
                    id: product.id,
                    name: product.name,
                    variant,
                    price: product.price,
                    image: product.images[0] ?? '',
                  },
                  qty,
                )
              }
              className="h-11 flex-1 rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink disabled:bg-panel2 disabled:text-steel"
            >
              Adicionar ao carrinho
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 font-mono text-[11px] text-steel">
            {product.specs.map((s) => (
              <span key={s} className="rounded border border-line px-2 py-1">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
            <span>Envio 48 h</span>
            <span>Devolução 30 dias</span>
            <span>Garantia 2 anos</span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-medium text-white">Na mesma linha</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </StoreShell>
  );
}
