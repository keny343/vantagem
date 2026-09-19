import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Product } from '../api/client';
import { StoreShell } from '../layout/StoreShell';
import { ProductCard, ProductSkeleton } from '../ui/ProductCard';
import { formatEuro } from '../utils/format';

export function CatalogoPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [categoria, setCategoria] = useState(params.get('categoria') ?? '');
  const [marca, setMarca] = useState(params.get('marca') ?? '');
  const [max, setMax] = useState(Number(params.get('max') ?? 3500));
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [c, m] = await Promise.all([api.categorias(), api.marcas()]);
      setCategorias(c.categorias.map((x) => x.name));
      setMarcas(m.brands);
    })();
  }, []);

  useEffect(() => {
    setQ(params.get('q') ?? '');
    setCategoria(params.get('categoria') ?? '');
    setMarca(params.get('marca') ?? '');
  }, [params]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.produtos({
            q: q || undefined,
            categoria: categoria || undefined,
            marca: marca || undefined,
            max,
          });
          setProducts(res.products);
        } finally {
          setLoading(false);
        }
      })();
    }, 200);
    return () => clearTimeout(t);
  }, [q, categoria, marca, max]);

  const countLabel = useMemo(() => `${products.length} referências`, [products.length]);

  function limpar() {
    setQ('');
    setCategoria('');
    setMarca('');
    setMax(3500);
    setParams({});
  }

  return (
    <StoreShell>
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Catálogo</h1>
          <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-steel uppercase">
            {countLabel}
          </p>
        </div>
        <div className="flex h-10 w-full max-w-xs items-center gap-2 rounded-md bg-panel px-3 ring-1 ring-line focus-within:ring-acid/60">
          <span className="font-mono text-xs text-steel">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar no catálogo…"
            aria-label="Pesquisar no catálogo"
            className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-steel/70"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="self-start lg:sticky lg:top-24">
          <div className="rounded-[14px] border border-line bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="label-mono">Filtros</span>
              <button
                type="button"
                onClick={limpar}
                className="font-mono text-[10px] tracking-[0.1em] text-steel uppercase hover:text-acid"
              >
                Limpar
              </button>
            </div>
            <div className="mb-5">
              <div className="mb-2 font-display text-sm font-medium text-white">Categoria</div>
              <div className="space-y-1">
                {categorias.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoria(categoria === c ? '' : c)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      categoria === c
                        ? 'bg-acid/15 text-acid'
                        : 'text-zinc-300 hover:bg-panel2 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5 border-t border-line pt-4">
              <div className="mb-2 font-display text-sm font-medium text-white">Preço máximo</div>
              <input
                type="range"
                min={40}
                max={3500}
                step={10}
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full accent-acid"
                aria-label="Preço máximo"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-steel">
                <span>40 €</span>
                <span className="text-acid">{formatEuro(max)}</span>
              </div>
            </div>
            <div className="border-t border-line pt-4">
              <div className="mb-2 font-display text-sm font-medium text-white">Marca</div>
              <div className="space-y-1">
                {marcas.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarca(marca === m ? '' : m)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      marca === m
                        ? 'bg-acid/15 text-acid'
                        : 'text-zinc-300 hover:bg-panel2 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[14px] border border-line bg-panel p-10 text-center">
              <p className="font-display text-lg text-white">Sem resultados</p>
              <p className="mt-2 font-mono text-[11px] text-steel">
                Ajusta os filtros ou limpa a pesquisa.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
