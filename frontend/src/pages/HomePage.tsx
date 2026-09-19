import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, urlMedia, type Product } from '../api/client';
import { eAdmin } from '../auth/papeis';
import { useSession } from '../auth/SessionContext';
import { LOJA } from '../config/loja';
import { StoreShell } from '../layout/StoreShell';
import { ProductCard, ProductSkeleton } from '../ui/ProductCard';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro } from '../utils/format';
import { useTitulo } from '../hooks/useTitulo';

export function HomePage() {
  useTitulo('Início');
  const { user } = useSession();
  const admin = eAdmin(user);
  const [capa, setCapa] = useState<Product | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  function carregar() {
    setLoading(true);
    setErro('');
    void (async () => {
      try {
        const [cats, heros, prods] = await Promise.all([
          api.categorias(),
          api.produtos({ hero: 'true' }),
          api.produtos({ featured: 'true' }),
        ]);
        const artigoCapa = heros.products[0] ?? null;
        setCategorias(cats.categorias);
        setCapa(artigoCapa);
        setFeatured(prods.products.filter((p) => p.slug !== artigoCapa?.slug).slice(0, 6));
      } catch {
        setErro('Não foi possível carregar a loja.');
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <StoreShell>
      {erro && (
        <div className="mt-6">
          <ErroBloco
            mensagem={erro}
            onTentar={carregar}
            extra={<Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">Ajuda</Link>}
          />
        </div>
      )}
      <section className="relative mt-8 overflow-hidden rounded-[14px] border border-line">
        <div className="diagonal-wash absolute inset-0 -skew-x-6 scale-125" />
        <div className="relative grid gap-6 p-7 sm:p-10 lg:grid-cols-2">
          <div className="max-w-[48ch]">
            <span className="font-mono text-[11px] tracking-[0.22em] text-acid uppercase">
              {capa ? 'Artigo em destaque' : `Loja oficial · ${LOJA.pais}`}
            </span>
            <h1 className="mt-4 font-display text-3xl leading-tight font-semibold text-balance text-white sm:text-5xl">
              {capa ? capa.name : 'Electrónica para trabalho e casa, com factura e garantia.'}
            </h1>
            <p className="mt-4 max-w-[42ch] text-pretty text-zinc-400">
              {capa
                ? capa.description
                : `Portáteis, telemóveis, periféricos e energia. Preços em Kwanzas, com IVA incluído, e envio para Luanda e províncias.`}
            </p>
            {capa && (
              <p className="mt-4 font-display text-2xl text-white">
                {formatEuro(capa.price)}
                <span className="ml-2 font-mono text-[11px] text-steel">IVA incluído</span>
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {capa ? (
                <Link
                  to={`/produto/${capa.slug}`}
                  className="grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink ring-1 ring-acid transition-transform hover:brightness-105 active:scale-[0.98]"
                >
                  Ver artigo
                </Link>
              ) : (
                <Link
                  to="/catalogo"
                  className="grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink ring-1 ring-acid transition-transform hover:brightness-105 active:scale-[0.98]"
                >
                  Ver catálogo
                </Link>
              )}
              {capa && (
                <Link
                  to="/catalogo"
                  className="grid h-11 place-items-center rounded-lg px-5 font-mono text-xs tracking-[0.12em] text-zinc-200 uppercase ring-1 ring-line transition-colors hover:text-acid"
                >
                  Catálogo
                </Link>
              )}
              {admin && (
                <Link
                  to={capa ? `/admin/produtos/${capa.slug}` : '/admin/produtos'}
                  className="grid h-11 place-items-center rounded-lg px-5 font-mono text-xs tracking-[0.12em] text-acid uppercase ring-1 ring-acid/40"
                >
                  {capa ? 'Editar capa' : 'Escolher capa'}
                </Link>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-6 font-mono text-[11px] text-steel">
              <span>IVA incluído</span>
              <span>·</span>
              <span>Envio grátis a partir de {formatEuro(LOJA.envioGratisAPartir)}</span>
              <span>·</span>
              <span>Devolução {LOJA.diasDevolucao} dias</span>
            </div>
          </div>
          <div className="relative">
            {capa ? (
              <img
                src={urlMedia(capa.images[0])}
                alt={capa.name}
                width={1024}
                height={1024}
                className="aspect-square w-full rounded-[12px] border border-line object-cover"
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-[12px] border border-line bg-panel2 p-8 text-center">
                <div>
                  <p className="font-display text-xl text-white">
                    {admin ? 'Ainda não há artigo na capa' : 'Catálogo a ser preenchido'}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-steel">
                    {admin
                      ? 'Escolhe um artigo no painel para aparecer aqui em destaque.'
                      : 'Os artigos aparecem aqui assim que forem publicados no painel.'}
                  </p>
                </div>
              </div>
            )}
            <div className="glass absolute bottom-4 left-4 rounded-lg border border-line px-4 py-3">
              <div className="label-mono">
                {capa ? `${capa.brand} · ${capa.category}` : `${LOJA.pais} · Luanda`}
              </div>
              <div className="mt-1 font-display text-sm text-white">
                {capa
                  ? stockTexto(capa.stock)
                  : `Envio ${formatEuro(LOJA.custoEnvio)} · grátis acima de ${formatEuro(LOJA.envioGratisAPartir)}`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-medium text-white">Categorias</h2>
          <span className="font-mono text-[11px] tracking-[0.15em] text-steel uppercase">
            {categorias.length} departamentos
          </span>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {categorias.map((c, i) => (
            <Link
              key={c.slug}
              to={`/catalogo?categoria=${encodeURIComponent(c.slug)}`}
              className={`grid h-10 shrink-0 items-center rounded-md px-4 font-mono text-xs tracking-[0.1em] uppercase transition-colors ${
                i === 0 ? 'bg-acid text-ink' : 'text-zinc-300 ring-1 ring-line hover:text-acid'
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
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-[14px] border border-line bg-panel p-8 text-center">
            <p className="font-display text-white">Ainda não há mais artigos em destaque</p>
            <p className="mt-2 font-mono text-[11px] text-steel">
              {admin
                ? 'No painel, marca artigos para aparecerem também nesta grelha.'
                : 'Quando houver novidades, aparecem aqui.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 overflow-hidden rounded-[14px] border border-line bg-panel">
        <div className="diagonal-wash grid gap-6 p-7 sm:grid-cols-[1.2fr_0.8fr] sm:p-10">
          <div>
            <span className="font-mono text-[11px] tracking-[0.22em] text-acid uppercase">
              Compra com documento
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
              Express, Multicaixa ou transferência. NIF na encomenda.
            </h2>
            <p className="mt-3 max-w-[44ch] text-zinc-400">
              O pedido só fica pago depois da confirmação. Stock é reservado; se cancelares, volta
              para a loja. {LOJA.nomeLegal} · NIF {LOJA.nif}.
            </p>
          </div>
          <div className="flex items-end">
            <Link
              to="/empresa"
              className="grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink transition-transform hover:brightness-105 active:scale-[0.98]"
            >
              Dados da empresa
            </Link>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}

function stockTexto(stock: number): string {
  if (stock <= 0) return 'Esgotado de momento';
  if (stock <= 5) return `${stock} unidades em stock`;
  return 'Disponível para envio';
}
