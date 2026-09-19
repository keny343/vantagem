import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Product } from '../api/client';
import { StoreShell } from '../layout/StoreShell';
import { ProductCard, ProductSkeleton } from '../ui/ProductCard';

export function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [cats, prods] = await Promise.all([
          api.categorias(),
          api.produtos({ featured: 'true' }),
        ]);
        setCategorias(cats.categorias);
        setFeatured(prods.products.slice(0, 6));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <StoreShell>
      <section className="relative mt-8 overflow-hidden rounded-[14px] border border-line">
        <div className="diagonal-wash absolute inset-0 -skew-x-6 scale-125" />
        <div className="glass absolute -top-24 -right-24 hidden size-80 -skew-x-6 rounded-full ring-1 ring-acid/20 lg:block" />
        <div className="relative grid gap-6 p-7 sm:p-10 lg:grid-cols-2">
          <div className="max-w-[46ch]">
            <span className="font-mono text-[11px] tracking-[0.22em] text-acid uppercase">
              Lançamento · Série 07
            </span>
            <h1 className="mt-4 font-display text-3xl leading-tight font-semibold text-balance text-white sm:text-5xl">
              O som modular, calibrado ao milímetro.
            </h1>
            <p className="mt-4 max-w-[40ch] text-pretty text-zinc-400">
              O módulo VNTG-07 chega com acabamento anodizado, encaixe magnético e resposta
              ajustável por firmware. Engenharia de precisão, sem ruído à vista.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/catalogo"
                className="grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink ring-1 ring-acid transition-transform hover:brightness-105 active:scale-[0.98]"
              >
                Explorar coleção
              </Link>
              <Link
                to="/produto/deck-07"
                className="grid h-11 place-items-center rounded-lg px-5 font-mono text-xs tracking-[0.12em] text-zinc-200 uppercase ring-1 ring-line transition-colors hover:text-acid"
              >
                Ver specs
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 font-mono text-[11px] text-steel">
              <span>DAC 32-bit</span>
              <span>·</span>
              <span>Latência 4 ms</span>
              <span>·</span>
              <span>USB-C</span>
            </div>
          </div>
          <div className="relative">
            <img
              src="/assets/hero-deck.jpg"
              alt="Deck modular VNTG-07"
              width={1024}
              height={1024}
              className="aspect-square w-full rounded-[12px] border border-line object-cover"
            />
            <div className="glass absolute bottom-4 left-4 rounded-lg border border-line px-4 py-3">
              <div className="label-mono">Em stock</div>
              <div className="mt-1 font-display text-sm text-white">Entrega em 48 h</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-medium text-white">Categorias</h2>
          <span className="font-mono text-[11px] tracking-[0.15em] text-steel uppercase">
            {categorias.length} linhas
          </span>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {categorias.map((c, i) => (
            <Link
              key={c.slug}
              to={`/catalogo?categoria=${encodeURIComponent(c.name)}`}
              className={`grid h-10 shrink-0 items-center rounded-md px-4 font-mono text-xs tracking-[0.1em] uppercase transition-colors ${
                i === 0
                  ? 'bg-acid text-ink'
                  : 'text-zinc-300 ring-1 ring-line hover:text-acid'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-medium text-white">Em destaque</h2>
          <Link
            to="/catalogo"
            className="font-mono text-[11px] tracking-[0.15em] text-steel uppercase hover:text-acid"
          >
            Ver catálogo →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="mt-12 overflow-hidden rounded-[14px] border border-line bg-panel">
        <div className="diagonal-wash grid gap-6 p-7 sm:grid-cols-[1.2fr_0.8fr] sm:p-10">
          <div>
            <span className="font-mono text-[11px] tracking-[0.22em] text-acid uppercase">
              Semana da energia
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
              Até 20% em carregamento e baterias
            </h2>
            <p className="mt-3 max-w-[44ch] text-zinc-400">
              Envio grátis acima de 90 €, devolução em 30 dias e garantia estendida de 2 anos em
              todas as referências.
            </p>
          </div>
          <div className="flex items-end">
            <Link
              to="/catalogo?categoria=Energia"
              className="grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink transition-transform hover:brightness-105 active:scale-[0.98]"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
