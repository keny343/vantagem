import { Link } from 'react-router-dom';
import { StoreShell } from '../layout/StoreShell';

export function NotFoundPage() {
  return (
    <StoreShell>
      <div className="mt-24 text-center">
        <h1 className="font-display text-6xl font-semibold text-white">404</h1>
        <h2 className="mt-3 font-display text-xl text-white">Página não encontrada</h2>
        <p className="mt-2 text-steel">O endereço que procuras não existe ou foi movido.</p>
        <Link
          to="/"
          className="mt-8 inline-grid h-11 place-items-center rounded-full bg-acid px-6 font-display text-sm font-semibold text-ink"
        >
          Voltar ao início
        </Link>
      </div>
    </StoreShell>
  );
}
