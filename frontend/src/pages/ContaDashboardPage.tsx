import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface DashboardData {
  utilizador: {
    nome: string;
    email: string;
  };
  estatisticas: {
    pedidos: number;
    favoritos: number;
    cupons: number;
  };
  pedidosRecentes: Array<{
    referencia: string;
    total: number;
    estado: string;
    data: string;
  }>;
}

export default function ContaDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${(import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ?? ''}/conta/dashboard`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-steel/20 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-steel/20 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <p className="text-steel">Erro ao carregar dashboard</p>
      </div>
    );
  }

  const estadoMap: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'text-yellow-400' },
    pago: { label: 'Pago', color: 'text-green-400' },
    em_preparacao: { label: 'Em preparação', color: 'text-blue-400' },
    enviado: { label: 'Enviado', color: 'text-purple-400' },
    entregue: { label: 'Entregue', color: 'text-green-500' },
    cancelado: { label: 'Cancelado', color: 'text-red-400' },
  };

  return (
    <div className="min-h-screen bg-vault">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-acid mb-2">
            Olá, {data.utilizador.nome} 👋
          </h1>
          <p className="text-steel">{data.utilizador.email}</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/conta/pedidos"
            className="bg-shadow border border-steel/20 p-6 rounded-lg hover:border-acid/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-steel text-sm mb-1">Pedidos</p>
                <p className="text-3xl font-bold text-acid">{data.estatisticas.pedidos}</p>
              </div>
              <div className="text-4xl">🛒</div>
            </div>
          </Link>

          <Link
            to="/conta/favoritos"
            className="bg-shadow border border-steel/20 p-6 rounded-lg hover:border-acid/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-steel text-sm mb-1">Favoritos</p>
                <p className="text-3xl font-bold text-acid">{data.estatisticas.favoritos}</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
          </Link>

          <Link
            to="/conta/cupons"
            className="bg-shadow border border-steel/20 p-6 rounded-lg hover:border-acid/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-steel text-sm mb-1">Cupons</p>
                <p className="text-3xl font-bold text-acid">{data.estatisticas.cupons}</p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </Link>
        </div>

        {/* Pedidos recentes */}
        <div className="bg-shadow border border-steel/20 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-acid mb-4">Pedidos recentes</h2>
          {data.pedidosRecentes.length === 0 ? (
            <p className="text-steel">Ainda não tens pedidos.</p>
          ) : (
            <div className="space-y-3">
              {data.pedidosRecentes.map((pedido) => (
                <Link
                  key={pedido.referencia}
                  to={`/pedido/${pedido.referencia}`}
                  className="flex items-center justify-between p-4 bg-vault border border-steel/20 rounded hover:border-acid/50 transition-colors"
                >
                  <div>
                    <p className="text-acid font-mono text-sm">#{pedido.referencia}</p>
                    <p className="text-steel text-xs">
                      {new Date(pedido.data).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-acid font-mono">{pedido.total.toFixed(2)} €</p>
                    <p className={`text-sm ${estadoMap[pedido.estado]?.color || 'text-steel'}`}>
                      {estadoMap[pedido.estado]?.label || pedido.estado}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/conta/perfil"
            className="p-4 bg-shadow border border-steel/20 rounded-lg hover:border-acid/50 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-acid font-semibold">Editar perfil</p>
              <p className="text-steel text-sm">Alterar dados pessoais</p>
            </div>
          </Link>

          <Link
            to="/conta/enderecos"
            className="p-4 bg-shadow border border-steel/20 rounded-lg hover:border-acid/50 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-acid font-semibold">Gerir endereços</p>
              <p className="text-steel text-sm">Adicionar ou editar endereços</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
