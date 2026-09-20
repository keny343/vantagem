import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, urlMedia, type Product } from '../api/client';
import { eAdmin } from '../auth/papeis';
import { useSession } from '../auth/SessionContext';
import { useCart } from '../cart/CartContext';
import { LOJA } from '../config/loja';
import { StoreShell } from '../layout/StoreShell';
import { ProductCard } from '../ui/ProductCard';
import { useAvisos } from '../ui/Avisos';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro, stockLabel } from '../utils/format';
import { useTitulo } from '../hooks/useTitulo';

export function ProdutoPage() {
  const { id = '' } = useParams();
  const cart = useCart();
  const { avisar } = useAvisos();
  const { user } = useSession();
  const admin = eAdmin(user);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [variant, setVariant] = useState('');
  const [qty, setQty] = useState(1);
  const [foto, setFoto] = useState(0);
  const [erro, setErro] = useState('');
  const [favorito, setFavorito] = useState(false);
  useTitulo(product?.name ?? 'Artigo');

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.produto(id);
        setProduct(res.product);
        setRelated(res.related);
        setVariant(res.product.variants.options[0] ?? 'Padrão');
        setFoto(0);
        setQty(1);
        setErro('');
      } catch {
        setErro('Produto não encontrado.');
        setProduct(null);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!user || !product || admin) return;
    void api
      .favoritos()
      .then((r) => setFavorito(r.products.some((p) => p.slug === product.slug)))
      .catch(() => undefined);
  }, [user, product]);

  const jaNoCarrinho = useMemo(() => {
    if (!product) return 0;
    return cart.lines
      .filter((l) => l.id === product.id && l.variant === variant)
      .reduce((s, l) => s + l.qty, 0);
  }, [cart.lines, product, variant]);

  const disponivel = product ? Math.max(0, product.stock - jaNoCarrinho) : 0;
  const garantia = product?.warrantyMonths ?? LOJA.garantiaMesesPadrao;

  if (erro) {
    return (
      <StoreShell>
        <div className="mt-16 max-w-lg">
          <ErroBloco
            titulo="Artigo não encontrado"
            mensagem={erro}
            extra={
              <>
                <Link
                  to="/catalogo"
                  className="grid h-10 place-items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
                >
                  Ver catálogo
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

  const actual = product;

  async function toggleFavorito() {
    if (!user || admin) return;
    try {
      if (favorito) {
        await api.removerFavorito(actual.slug);
        setFavorito(false);
        avisar('Saiu dos favoritos.', {
          tipo: 'info',
          acao: {
            label: 'Anular',
            onClick: () => {
              void api.adicionarFavorito(actual.slug).then(() => setFavorito(true));
            },
          },
        });
      } else {
        await api.adicionarFavorito(actual.slug);
        setFavorito(true);
        avisar('Guardado nos favoritos.');
      }
    } catch {
      avisar('Não foi possível actualizar os favoritos.', { tipo: 'erro' });
    }
  }

  async function definirCapa() {
    if (!admin) return;
    try {
      if (actual.hero) {
        await api.adminDefinirHero(null);
        setProduct({ ...actual, hero: false });
        avisar('Artigo retirado da capa.');
      } else {
        await api.adminDefinirHero(actual.slug);
        setProduct({ ...actual, hero: true });
        avisar('Este artigo passou a ser a capa.');
      }
    } catch {
      avisar('Não foi possível alterar a capa.', { tipo: 'erro' });
    }
  }

  return (
    <StoreShell>
      <div className="mt-6 font-mono text-[11px] tracking-[0.12em] text-steel uppercase">
        <Link to="/catalogo" className="hover:text-acid">
          Catálogo
        </Link>
        <span> / </span>
        <Link
          to={`/catalogo?categoria=${encodeURIComponent(product.categorySlug)}`}
          className="hover:text-acid"
        >
          {product.category}
        </Link>
        <span> / </span>
        <span className="text-ink/70">{product.brand}</span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-[14px] border border-line bg-panel">
            <img
              src={urlMedia(product.images[foto] ?? product.images[0])}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setFoto(i)}
                  className={`size-16 overflow-hidden rounded-lg border ${
                    foto === i ? 'border-acid' : 'border-line'
                  }`}
                >
                  <img src={urlMedia(src)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="label-mono">{product.brand}</div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-2xl text-ink">{formatEuro(product.price)}</span>
            {product.oldPrice !== null && (
              <span className="font-mono text-sm text-steel line-through">
                {formatEuro(product.oldPrice)}
              </span>
            )}
            <span className="font-mono text-[11px] text-steel">IVA incluído</span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-steel">{stockLabel(product.stock)}</p>
          <p className="mt-4 max-w-[48ch] text-steel">{product.description}</p>

          {product.variants.options.filter((o) => !['Único', 'Padrão'].includes(o)).length > 0 && (
          <div className="mt-6">
            <div className="label-mono mb-2">Versão</div>
            <div className="flex flex-wrap gap-2">
              {product.variants.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVariant(opt)}
                  className={`h-9 rounded-md px-3 font-mono text-[11px] ${
                    variant === opt
                      ? 'bg-acid text-canvas'
                      : 'text-canvas/70 ring-1 ring-line hover:text-acid'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            {admin ? (
              <>
                <Link
                  to={`/admin/produtos/${product.slug}`}
                  className="grid h-11 flex-1 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-canvas"
                >
                  Editar artigo
                </Link>
                <button
                  type="button"
                  onClick={() => void definirCapa()}
                  className="h-11 rounded-lg px-4 font-mono text-[11px] tracking-[0.12em] text-acid uppercase ring-1 ring-acid/40"
                >
                  {product.hero ? 'Na capa' : 'Pôr na capa'}
                </button>
              </>
            ) : (
              <>
            <div className="flex h-11 items-center rounded-lg border border-line">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 font-mono text-steel hover:text-acid"
              >
                -
              </button>
              <span className="min-w-8 text-center font-mono text-sm text-ink">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(Math.max(1, disponivel), q + 1))}
                className="px-3 font-mono text-steel hover:text-acid"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={disponivel === 0}
              onClick={() => {
                cart.add(
                  {
                    id: product.id,
                    name: product.name,
                    variant,
                    price: product.price,
                    image: product.images[0] ?? '',
                    stock: product.stock,
                  },
                  qty,
                );
                avisar(`${product.name} foi para o carrinho.`);
              }}
              className="h-11 flex-1 rounded-lg bg-acid px-6 font-display text-sm font-semibold text-canvas disabled:bg-panel2 disabled:text-steel"
            >
              {disponivel === 0 ? 'Sem stock' : 'Adicionar ao carrinho'}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => void toggleFavorito()}
                className={`grid size-11 place-items-center rounded-lg ring-1 ring-line ${
                  favorito ? 'bg-acid/20 text-acid' : 'text-steel hover:text-acid'
                }`}
                aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                ?
              </button>
            )}
              </>
            )}
          </div>
          {admin && (
            <p className="mt-3 font-mono text-[11px] text-steel">
              Estás a ver a loja como administrador — esta conta não compra.
              {product.hero ? ' Este é o artigo da capa.' : ''}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3 font-mono text-[11px] text-steel">
            {product.specs.map((s) => (
              <span key={s} className="rounded border border-line px-2 py-1">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
            <span>Envio em Angola {formatEuro(LOJA.custoEnvio)}</span>
            <span>
              <Link to="/devolucoes" className="hover:text-acid">
                Devolução {LOJA.diasDevolucao} dias
              </Link>
            </span>
            <span>Garantia {garantia} meses</span>
          </div>
        </div>
      </div>

      <Avaliacoes produtoId={product.id} />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-medium text-ink">Na mesma linha</h2>
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

function Avaliacoes({ produtoId }: { produtoId: string }) {
  const { user } = useSession();
  const { avisar } = useAvisos();
  const [lista, setLista] = useState<
    { id: string; estrelas_produto: number; comentario: string | null; utilizador_nome: string; created_at: string }[]
  >([]);
  const [pedidoId, setPedidoId] = useState('');
  const [estrelas, setEstrelas] = useState(5);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    void api.avaliacoes(produtoId).then((r) => setLista(r.avaliacoes)).catch(() => undefined);
    if (!user) return;
    void api.meusPedidos().then((r) => {
      const entregue = r.orders.find(
        (o) => o.status === 'entregue' && o.items.some((i) => i.productId === produtoId),
      );
      if (entregue) setPedidoId(entregue.id);
    }).catch(() => undefined);
  }, [produtoId, user]);

  return (
    <section className="mt-14 max-w-2xl">
      <h2 className="font-display text-xl text-ink">Opiniões</h2>
      {lista.length === 0 && <p className="mt-3 font-mono text-[11px] text-steel">Ainda não há opiniões.</p>}
      <div className="mt-4 space-y-3">
        {lista.map((a) => (
          <article key={a.id} className="rounded-[14px] border border-line bg-panel p-4">
            <p className="font-display text-ink">
              {'?'.repeat(a.estrelas_produto)}{' '}
              <span className="font-mono text-[11px] text-steel">{a.utilizador_nome}</span>
            </p>
            {a.comentario && <p className="mt-2 text-sm text-ink/70">{a.comentario}</p>}
          </article>
        ))}
      </div>
      {pedidoId && (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void api
              .criarAvaliacao({
                produto_id: produtoId,
                pedido_id: pedidoId,
                estrelas_produto: estrelas,
                comentario,
              })
              .then(() => {
                avisar('Opinião publicada.');
                setPedidoId('');
                return api.avaliacoes(produtoId);
              })
              .then((r) => setLista(r.avaliacoes))
              .catch(() => avisar('Não foi possível publicar.', { tipo: 'erro' }));
          }}
        >
          <p className="font-mono text-[11px] text-steel">Compraste este artigo — deixa a tua opinião.</p>
          <label className="block font-mono text-[10px] text-steel uppercase">
            Estrelas
            <select
              value={estrelas}
              onChange={(e) => setEstrelas(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-line bg-panel2 px-3"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
            placeholder="Como correu a compra?"
          />
          <button className="h-10 rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas">
            Publicar
          </button>
        </form>
      )}
    </section>
  );
}
