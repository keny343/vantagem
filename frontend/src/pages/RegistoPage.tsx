import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { mensagemParaUtilizador } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { destinoAposLogin, urlComSeguir } from '../auth/seguir';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { Campo } from '../ui/Campo';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

export function RegistoPage() {
  const { user, registo } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const alertaRef = useRef<HTMLDivElement>(null);
  useTitulo('Criar conta');

  useEffect(() => {
    if (erro) alertaRef.current?.focus();
  }, [erro]);

  if (user) return <Navigate to={destinoAposLogin(location.search, user.role)} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro('');
    try {
      await registo({
        nome,
        email,
        password,
        ...(telefone.trim() ? { telefone } : {}),
      });
      void navigate(destinoAposLogin(location.search, 'cliente'));
    } catch (err) {
      setErro(mensagemParaUtilizador(err, 'Não foi possível criar a conta. Tenta outra vez.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto mt-16 max-w-md rounded-[14px] border border-line bg-panel p-8">
        <div className="label-mono">Conta</div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Criar conta</h1>
        <p className="mt-2 text-sm text-steel">
          Com a conta acompanhas a encomenda e vês quando a loja confirmar o pagamento.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => void onSubmit(e)}
          onInvalidCapture={onInvalidPt}
          onInput={onInputPt}
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
          <Campo id="reg-nome" label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <Campo
            id="reg-email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Campo
            id="reg-tel"
            label="Telemóvel"
            hint="Opcional. 9xxxxxxxx ou +244 9xxxxxxxx"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <Campo
            id="reg-passe"
            label="Palavra-passe"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="Pelo menos 8 caracteres, com uma letra e um número."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={busy}
            className="h-11 w-full rounded-lg bg-acid font-display text-sm font-semibold text-canvas disabled:opacity-60"
          >
            {busy ? 'A criar…' : 'Criar conta'}
          </button>
        </form>
        <Link
          to={urlComSeguir('/login', location.search)}
          className="mt-4 grid h-11 place-items-center rounded-lg font-display text-sm font-semibold text-acid ring-1 ring-acid/40 hover:bg-acid/10"
        >
          Já tenho conta — entrar
        </Link>
      </div>
    </StoreShell>
  );
}
