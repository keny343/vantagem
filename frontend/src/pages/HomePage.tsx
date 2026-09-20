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

function stockTexto(stock: number): string {
  if (stock <= 0) return 'Esgotado';
  if (stock <= 5) return `Poucas unidades · ${stock}`;
  return 'Em stock';
}

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
    <StoreShell flush>
      {erro && (
        <div className="mx-auto max-w-[1400px] px-5 pt-6 sm:px-8">
          <ErroBloco
            mensagem={erro}
            onTentar={carregar}
            extra={
              <Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">
                Ajuda
              </Link>
            }
          />
        </div>
      )}

      <section className="relative min-h-[min(92vh,820px)] overflow-hidden facade-wash">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[12%] border-r border-line/60 md:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-[12%] hidden w-[12%] border-r border-line/40 md:block"
          aria-hidden
        />
        <div className="relative mx-auto grid min-h-[min(92vh,820px)] max-w-[1400px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-end px-5 pt-28 pb-12 sm:px-8 sm:pb-16 lg:pb-20">
            <p className="brand-in font-display text-[clamp(3rem,12vw,7.5rem)] leading-[0.9] font-semibold tracking-[-0.03em] text-ink">
              Vantagem
            </p>
            <h1 className="rise mt-6 max-w-[18ch] font-display text-2xl leading-tight font-medium text-balance text-ink sm:text-3xl">
              {capa
                ? capa.name
                : 'Electrónica com factura e garantia, em Kwanzas.'}
            </h1>
            <p className="rise mt-4 max-w-[40ch] text-pretty text-lg text-ink/70">
              {capa
                ? `${capa.brand} · ${formatEuro(capa.price)} com IVA incluído`
                : `Portáteis, telemóveis e periféricos com envio para ${LOJA.pais}.`}
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={capa ? `/produto/${capa.slug}` : '/catalogo'}
                className="grid h-12 place-items-center rounded-md bg-acid px-7 font-display text-sm font-semibold text-canvas transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
              >
                {capa ? 'Ver artigo' : 'Ver catálogo'}
              </Link>
              {capa && (
                <Link
                  to="/catalogo"
                  className="grid h-12 place-items-center rounded-md px-5 font-display text-sm font-medium text-ink ring-1 ring-ink/20 transition-colors hover:ring-acid hover:text-acid"
                >
                  Catálogo
                </Link>
              )}
              {admin && (
                <Link
                  to={capa ? `/admin/produtos/${capa.slug}` : '/admin/produtos'}
                  className="grid h-12 place-items-center rounded-md px-5 font-mono text-[11px] tracking-[0.12em] text-acid uppercase ring-1 ring-acid/40"
                >
                  {capa ? 'Editar capa' : 'Escolher capa'}
                </Link>
              )}
            </div>
          </div>

          <div className="relative min-h-[280px] lg:min-h-full">
            {capa ? (
              <img
                src={urlMedia(capa.images[0])}
                alt={capa.name}
                width={1200}
                height={1200}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="shade-band absolute inset-0 flex items-end p-8 sm:p-10">
                <div className="max-w-[32ch]">
                  <p className="font-display text-xl font-medium">
                    {admin ? 'Ainda não há artigo na capa' : 'Catálogo a ser preenchido'}
                  </p>
                  <p className="mt-2 text-sm opacity-70">
                    {admin
                      ? 'Escolhe um artigo no painel para ocupar este plano.'
                      : 'Os artigos aparecem aqui quando forem publicados.'}
                  </p>
                </div>
              </div>
            )}
            {capa && (
              <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-4 sm:right-8 sm:bottom-8 sm:left-auto sm:max-w-xs">
                <div className="rounded-md bg-canvas/95 px-4 py-3 shadow-[0_12px_40px_-20px_rgba(20,33,38,0.45)] ring-1 ring-line">
                  <p className="label-mono">{capa.brand}</p>
                  <p className="mt-1 font-display text-sm font-medium text-ink">{stockTexto(capa.stock)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <section className="mt-14">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl font-medium text-ink">Departamentos</h2>
            <span className="font-mono text-[11px] tracking-[0.14em] text-steel uppercase">
              {categorias.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-line sm:grid-cols-3 lg:grid-cols-6">
            {categorias.map((c) => (
              <Link
                key={c.slug}
                to={`/catalogo?categoria=${encodeURIComponent(c.slug)}`}
                className="bg-panel px-4 py-5 font-display text-sm font-medium text-ink transition-colors hover:bg-acid hover:text-canvas"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 mb-20">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl font-medium text-ink">Em destaque</h2>
            <Link
              to="/catalogo"
              className="font-mono text-[11px] tracking-[0.14em] text-steel uppercase hover:text-acid"
            >
              Catálogo →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="border border-line bg-panel px-8 py-12 text-center">
              <p className="font-display text-lg text-ink">Ainda não há mais artigos em destaque</p>
              <p className="mt-2 text-sm text-steel">
                {admin
                  ? 'No painel, marca artigos para esta grelha.'
                  : 'Quando houver novidades, aparecem aqui.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-20 overflow-hidden rounded-md shade-band">
          <div className="grid gap-8 p-8 sm:grid-cols-[1.2fr_0.8fr] sm:p-12">
            <div>
              <h2 className="font-display text-2xl font-medium text-balance">
                Compra com documento, pagamento com comprovativo
              </h2>
              <p className="mt-4 max-w-[46ch] text-pretty opacity-75">
                Transfere o valor, anexa a fotografia do comprovativo, e a loja confirma. Factura e
                garantia inclusas — sem surpresas de stock.
              </p>
              <Link
                to="/ajuda"
                className="mt-6 inline-grid h-11 place-items-center rounded-md bg-canvas px-5 font-display text-sm font-semibold text-ink"
              >
                Como funciona
              </Link>
            </div>
            <div className="flex flex-col justify-end gap-3 font-mono text-[11px] tracking-[0.12em] opacity-60 uppercase">
              <span>IVA incluído</span>
              <span>Envio grátis a partir de {formatEuro(LOJA.envioGratisAPartir)}</span>
              <span>Devolução {LOJA.diasDevolucao} dias</span>
            </div>
          </div>
        </section>
      </div>
    </StoreShell>
  );
}
