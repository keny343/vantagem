import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { StoreShell } from '../layout/StoreShell';

export function LoginPage() {
  const { user, login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/conta" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      await login(email, password);
      void navigate('/conta');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha no login.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto mt-16 max-w-md rounded-[14px] border border-line bg-panel p-8">
        <div className="label-mono">Sessão</div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white">Entrar</h1>
        <p className="mt-2 font-mono text-[11px] text-steel">
          Demo: admin@vantagem.pt / AdminDemo!2026
        </p>
        <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm outline-none focus:border-acid/60"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Palavra-passe"
            className="h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm outline-none focus:border-acid/60"
          />
          {erro && <p className="font-mono text-[11px] text-destructive">{erro}</p>}
          <button
            disabled={busy}
            className="h-11 w-full rounded-lg bg-acid font-display text-sm font-semibold text-ink disabled:opacity-60"
          >
            {busy ? 'A autenticar…' : 'Entrar'}
          </button>
        </form>
        <Link to="/" className="mt-4 block text-center font-mono text-[11px] text-steel hover:text-acid">
          Voltar ao início
        </Link>
      </div>
    </StoreShell>
  );
}
