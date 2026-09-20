import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { Campo } from '../ui/Campo';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

export function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  useTitulo('Recuperar palavra-passe');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      await api.recuperar(email);
      setOk(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto mt-16 max-w-md rounded-[14px] border border-line bg-panel p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Recuperar palavra-passe</h1>
        {ok ? (
          <p className="mt-4 text-sm text-steel">
            Se existir uma conta com este email, enviámos um link válido por uma hora. Sem servidor
            de email configurado, o link aparece no registo da API.
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
              id="rec-email"
              label="Email da conta"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              disabled={busy}
              className="h-11 w-full rounded-lg bg-acid font-display text-sm font-semibold text-canvas disabled:opacity-60"
            >
              {busy ? 'A enviar…' : 'Enviar link'}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-4 inline-block font-mono text-[11px] text-acid">
          Voltar a entrar
        </Link>
      </div>
    </StoreShell>
  );
}
