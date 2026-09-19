import { useEffect, useState } from 'react';
import { type Product } from '../api/client';
import { ProductCard } from '../ui/ProductCard';

interface FavoritosResponse {
  products: Product[];
}

export default function FavoritosPage() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarFavoritos = () => {
    setLoading(true);
    fetch('/api/conta/favoritos', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: FavoritosResponse) => setProdutos(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarFavoritos();
  }, []);

  const removerFavorito = (produtoId: string) => {
    fetch(`/api/conta/favoritos/${produtoId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then(() => {
        setProdutos((prev) => prev.filter((p) => p.id !== produtoId));
      })
      .catch(console.error);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-steel/20 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-steel/20 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vault">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-acid mb-8">❤️ Favoritos</h1>

        {produtos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-steel mb-4">Ainda não tens produtos favoritos.</p>
            <a
              href="/catalogo"
              className="inline-block px-6 py-3 bg-acid text-vault font-bold rounded hover:bg-acid/90 transition-colors"
            >
              Explorar catálogo
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {produtos.map((produto) => (
              <div key={produto.id} className="relative group">
                <ProductCard product={produto} />
                <button
                  onClick={() => removerFavorito(produto.id)}
                  className="absolute top-2 right-2 bg-red-500/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remover favorito"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
