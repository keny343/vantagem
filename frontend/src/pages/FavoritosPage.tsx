import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, type Product } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { ErroBloco } from '../ui/ErroBloco';
import { ProductCard } from '../ui/ProductCard';

export default function FavoritosPage() {
  const { user, loading: sessionLoading } = useSession();
  const { avisar } = useAvisos();
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  useTitulo('Favoritos');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await api.favoritos();
      setProdutos(res.products);
    } catch {
      setErro('Não foi possível carregar os favoritos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void carregar();
  }, [user, carregar]);

  async function remover(produto: Product) {
    try {
      await api.removerFavorito(produto.slug);
      setProdutos((prev) => prev.filter((p) => p.id !== produto.id));
      avisar(`${produto.name} saiu dos favoritos.`, {
        tipo: 'info',
        acao: {
          label: 'Anular',
          onClick: () => {
            void api.adicionarFavorito(produto.slug).then(() => {
              setProdutos((prev) =>
                prev.some((p) => p.id === produto.id) ? prev : [produto, ...prev],
              );
            });
          },
        },
      });
    } catch {
      setErro('Não foi possível remover o favorito.');
    }
  }

  if (sessionLoading) {
    return (
      <StoreShell>
        <div className="mt-16 text-center font-mono text-steel">A carregar…</div>
      </StoreShell>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <StoreShell>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <div className="label-mono">Conta</div>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Favoritos</h1>
        </div>
        <Link to="/conta" className="font-mono text-[11px] text-steel hover:text-acid">
          ← Voltar
        </Link>
      </div>

      {erro && (
        <div className="mt-6">
          <ErroBloco
            mensagem={erro}
            onTentar={() => void carregar()}
            extra={
              <Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">
                Ajuda
              </Link>
            }
          />
        </div>
      )}

      {loading ? (
        <p className="mt-10 font-mono text-[11px] text-steel">A carregar favoritos…</p>
      ) : produtos.length === 0 && !erro ? (
        <div className="mt-10 rounded-[14px] border border-line bg-panel p-8 text-center">
          <p className="font-mono text-[11px] text-steel">Ainda não tens artigos favoritos.</p>
          <Link
            to="/catalogo"
            className="mt-4 inline-grid h-10 place-items-center rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {produtos.map((produto) => (
            <div key={produto.id} className="relative">
              <ProductCard product={produto} />
              <button
                type="button"
                onClick={() => void remover(produto)}
                className="absolute top-3 right-3 rounded-md bg-canvas/80 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-ink uppercase ring-1 ring-line hover:text-acid"
                aria-label={`Retirar ${produto.name} dos favoritos`}
              >
                Retirar
              </button>
            </div>
          ))}
        </div>
      )}
    </StoreShell>
  );
}
