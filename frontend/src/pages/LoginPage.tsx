import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { Campo } from '../ui/Campo';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

export function LoginPage() {
  const { user, login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const alertaRef = useRef<HTMLDivElement>(null);
  useTitulo('Entrar');

  useEffect(() => {
    if (erro) alertaRef.current?.focus();
  }, [erro]);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/conta'} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      await login(email, password);
      const sessao = await api.me();
      void navigate(sessao.user?.role === 'admin' ? '/admin' : '/conta');
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? `${err.message} Confirma o email e a palavra-passe, ou pede ajuda.`
          : 'Não foi possível entrar. Tenta outra vez.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto mt-16 max-w-md rounded-[14px] border border-line bg-panel p-8">
        <div className="label-mono">Sessão</div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white">Entrar</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cliente: compras e encomendas. Administrador: gere a loja e não compra.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => void onSubmit(e)}
          onInvalidCapture={onInvalidPt}
          onInput={onInputPt}
          noValidate={false}
        >
          {erro && (
            <div
              ref={alertaRef}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-destructive/40 px-3 py-2 font-mono text-[11px] text-destructive"
            >
              {erro}
            </div>
          )}
          <Campo
            id="login-email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <Campo
              id="login-passe"
              label="Palavra-passe"
              type={mostrar ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setMostrar((m) => !m)}
              className="mt-2 font-mono text-[10px] tracking-[0.12em] text-steel uppercase hover:text-acid"
            >
              {mostrar ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
            </button>
          </div>
          <button
            disabled={busy}
            className="h-11 w-full rounded-lg bg-acid font-display text-sm font-semibold text-ink disabled:opacity-60"
          >
            {busy ? 'A autenticar…' : 'Entrar'}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-steel">
          <Link to="/registo" className="text-acid hover:underline">
            Criar conta
          </Link>
          <Link to="/recuperar" className="hover:text-acid">
            Recuperar palavra-passe
          </Link>
        </div>
        <div className="mt-3 flex justify-between font-mono text-[11px] text-steel">
          <Link to="/" className="hover:text-acid">
            Voltar ao início
          </Link>
          <Link to="/ajuda" className="hover:text-acid">
            Ajuda
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
