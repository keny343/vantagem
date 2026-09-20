import { Link } from 'react-router-dom';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';

export function NotFoundPage() {
  useTitulo('Página não encontrada');
  return (
    <StoreShell>
      <div className="mt-24 text-center">
        <h1 className="font-display text-6xl font-semibold text-ink">404</h1>
        <h2 className="mt-3 font-display text-xl text-ink">Página não encontrada</h2>
        <p className="mt-2 text-steel">
          O endereço não existe ou foi movido. Podes voltar ao início, ver o catálogo ou abrir a
          ajuda.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-canvas"
          >
            Início
          </Link>
          <Link
            to="/catalogo"
            className="inline-grid h-11 place-items-center rounded-lg px-6 font-mono text-[11px] text-ink/80 uppercase ring-1 ring-line"
          >
            Catálogo
          </Link>
          <Link
            to="/ajuda"
            className="inline-grid h-11 place-items-center rounded-lg px-6 font-mono text-[11px] text-ink/80 uppercase ring-1 ring-line"
          >
            Ajuda
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
