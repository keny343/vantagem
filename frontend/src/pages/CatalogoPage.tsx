import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type Product } from '../api/client';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { ErroBloco } from '../ui/ErroBloco';
import { ProductCard, ProductSkeleton } from '../ui/ProductCard';
import { formatEuro } from '../utils/format';

const MAX_SLIDER = 500_000;

export function CatalogoPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [categoria, setCategoria] = useState(params.get('categoria') ?? '');
  const [marca, setMarca] = useState(params.get('marca') ?? '');
  const [max, setMax] = useState(Number(params.get('max') ?? MAX_SLIDER));
  const [sort, setSort] = useState(params.get('sort') ?? 'relevancia');
  const [categorias, setCategorias] = useState<{ slug: string; name: string }[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  useTitulo(q ? `Pesquisa: ${q}` : 'Catálogo');

  useEffect(() => {
    void (async () => {
      const [c, m] = await Promise.all([api.categorias(), api.marcas()]);
      setCategorias(c.categorias);
      setMarcas(m.brands);
    })();
  }, []);

  useEffect(() => {
    setQ(params.get('q') ?? '');
    setCategoria(params.get('categoria') ?? '');
    setMarca(params.get('marca') ?? '');
    setSort(params.get('sort') ?? 'relevancia');
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
            max: max < MAX_SLIDER ? max : undefined,
            sort,
          });
          setProducts(res.products);
          setErro('');
        } catch {
          setErro('Não foi possível carregar o catálogo.');
        } finally {
          setLoading(false);
        }
      })();
    }, 200);
    return () => clearTimeout(t);
  }, [q, categoria, marca, max, sort]);

  const countLabel = useMemo(() => `${products.length} artigos`, [products.length]);

  function limpar() {
    setQ('');
    setCategoria('');
    setMarca('');
    setMax(MAX_SLIDER);
    setSort('relevancia');
    setParams({});
  }

  return (
    <StoreShell>
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Catálogo</h1>
          <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-steel uppercase">
            {countLabel}
          </p>
        </div>
        <div className="flex w-full max-w-xl flex-wrap items-center gap-2">
          <div className="flex h-10 min-w-[12rem] flex-1 items-center gap-2 rounded-md bg-panel px-3 ring-1 ring-line focus-within:ring-acid/60">
            <span className="font-mono text-xs text-steel">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar no catálogo…"
              aria-label="Pesquisar no catálogo"
              className="w-full bg-transparent text-sm text-ink/80 outline-none placeholder:text-steel/70"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-line bg-panel px-3 font-mono text-[11px] text-ink/80"
            aria-label="Ordenar"
          >
            <option value="relevancia">Relevância</option>
            <option value="preco_asc">Preço ↑</option>
            <option value="preco_desc">Preço ↓</option>
            <option value="novos">Novos</option>
          </select>
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
              <div className="mb-2 font-display text-sm font-medium text-ink">Categoria</div>
              <div className="space-y-1">
                {categorias.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategoria(categoria === c.slug ? '' : c.slug)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      categoria === c.slug
                        ? 'bg-acid/15 text-acid'
                        : 'text-ink/70 hover:bg-panel2 hover:text-ink'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5 border-t border-line pt-4">
              <div className="mb-2 font-display text-sm font-medium text-ink">Preço máximo</div>
              <input
                type="range"
                min={1_000}
                max={MAX_SLIDER}
                step={1_000}
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full accent-acid"
                aria-label="Preço máximo"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-steel">
                <span>1 000 Kz</span>
                <span className="text-acid">
                  {max >= MAX_SLIDER ? 'Sem tecto' : formatEuro(max)}
                </span>
              </div>
            </div>
            <div className="border-t border-line pt-4">
              <div className="mb-2 font-display text-sm font-medium text-ink">Marca</div>
              <div className="space-y-1">
                {marcas.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarca(marca === m ? '' : m)}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      marca === m
                        ? 'bg-acid/15 text-acid'
                        : 'text-ink/70 hover:bg-panel2 hover:text-ink'
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
          {(q || categoria || marca || max < MAX_SLIDER) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {q && <Chip texto={`Pesquisa: ${q}`} onLimpar={() => setQ('')} />}
              {categoria && (
                <Chip
                  texto={categorias.find((c) => c.slug === categoria)?.name ?? categoria}
                  onLimpar={() => setCategoria('')}
                />
              )}
              {marca && <Chip texto={marca} onLimpar={() => setMarca('')} />}
              {max < MAX_SLIDER && (
                <Chip texto={`Até ${formatEuro(max)}`} onLimpar={() => setMax(MAX_SLIDER)} />
              )}
            </div>
          )}
          {erro ? (
            <ErroBloco mensagem={erro} onTentar={() => setSort((s) => s)} extra={<Link to="/ajuda" className="font-mono text-[11px] text-acid">Ajuda</Link>} />
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[14px] border border-line bg-panel p-10 text-center">
              <p className="font-display text-lg text-ink">
                {q || categoria || marca || max < MAX_SLIDER
                  ? 'Sem resultados'
                  : 'Ainda não há artigos'}
              </p>
              <p className="mt-2 font-mono text-[11px] text-steel">
                {q || categoria || marca || max < MAX_SLIDER
                  ? 'Ajusta os filtros ou limpa a pesquisa.'
                  : 'O catálogo está vazio. Os artigos publicados no painel aparecem aqui.'}
              </p>
              {(q || categoria || marca || max < MAX_SLIDER) && (
                <button
                  type="button"
                  onClick={limpar}
                  className="mt-4 h-10 rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
                >
                  Limpar filtros
                </button>
              )}
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

function Chip({ texto, onLimpar }: { texto: string; onLimpar: () => void }) {
  return (
    <button
      type="button"
      onClick={onLimpar}
      className="rounded-full bg-acid/15 px-3 py-1 font-mono text-[10px] tracking-[0.08em] text-acid uppercase"
    >
      {texto} ✕
    </button>
  );
}
