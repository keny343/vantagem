import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { Campo } from '../ui/Campo';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

export function RedefinirPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  useTitulo('Nova palavra-passe');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      await api.redefinir(token, password);
      setOk(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível gravar a palavra-passe.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto mt-16 max-w-md rounded-[14px] border border-line bg-panel p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Nova palavra-passe</h1>
        {!token ? (
          <p className="mt-4 text-sm text-steel">Este link está incompleto. Pede um novo em Recuperar.</p>
        ) : ok ? (
          <p className="mt-4 text-sm text-ink/70">
            Palavra-passe actualizada.{' '}
            <Link to="/login" className="text-acid">
              Entrar
            </Link>
          </p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => void onSubmit(e)}
            onInvalidCapture={onInvalidPt}
            onInput={onInputPt}
          >
            {erro && (
              <p role="alert" className="font-mono text-[11px] text-destructive">
                {erro}
              </p>
            )}
            <Campo
              id="new-passe"
              label="Nova palavra-passe"
              type="password"
              required
              minLength={8}
              hint="Pelo menos 8 caracteres, com uma letra e um número."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              disabled={busy}
              className="h-11 w-full rounded-lg bg-acid font-display text-sm font-semibold text-canvas disabled:opacity-60"
            >
              {busy ? 'A gravar…' : 'Guardar'}
            </button>
          </form>
        )}
      </div>
    </StoreShell>
  );
}
