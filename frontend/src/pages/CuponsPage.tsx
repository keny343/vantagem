import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { request } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { ErroBloco } from '../ui/ErroBloco';
import { formatEuro } from '../utils/format';

interface Cupao {
  id: string;
  codigo: string;
  descricao: string | null;
  tipo: 'percentual' | 'fixo';
  valor: number;
  minimo_centimos: number;
  valido_ate: string;
}

export default function CuponsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [cupons, setCupons] = useState<Cupao[]>([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  useTitulo('Cupons');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const r = await request<{ cupons: Cupao[] }>('/api/conta/cupons');
      setCupons(r.cupons);
    } catch {
      setErro('Não foi possível carregar os cupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void carregar();
  }, [user, carregar]);

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
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Cupons</h1>
        </div>
        <Link to="/conta" className="font-mono text-[11px] text-steel hover:text-acid">
          Voltar
        </Link>
      </div>

      {erro && (
        <div className="mt-6">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} extra={<Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">Ajuda</Link>} />
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="font-mono text-[11px] text-steel">A carregar cupons…</p>
        ) : cupons.length === 0 ? (
          <p className="font-mono text-[11px] text-steel">Não tens cupons disponíveis.</p>
        ) : (
          cupons.map((c) => (
            <article key={c.id} className="rounded-[14px] border border-line bg-panel p-5">
              <p className="font-mono text-sm tracking-[0.16em] text-acid uppercase">{c.codigo}</p>
              <p className="mt-2 text-ink">
                {c.tipo === 'percentual' ? `${c.valor}%` : formatEuro(c.valor / 100)} de desconto
              </p>
              {c.descricao && <p className="mt-1 font-mono text-[11px] text-steel">{c.descricao}</p>}
              <p className="mt-3 font-mono text-[10px] text-steel">
                Mínimo {formatEuro(c.minimo_centimos / 100)} · até{' '}
                {new Date(c.valido_ate).toLocaleDateString('pt-AO')}
              </p>
            </article>
          ))
        )}
      </section>
    </StoreShell>
  );
}
