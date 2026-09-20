import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { request } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useAvisos } from '../ui/Avisos';
import { ErroBloco } from '../ui/ErroBloco';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

interface Perfil {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  morada: string | null;
  codigo_postal: string | null;
  cidade: string | null;
  created_at: string;
}

export default function PerfilPage() {
  const { user, loading: sessionLoading, refresh } = useSession();
  const { avisar } = useAvisos();
  useTitulo('Perfil');
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [morada, setMorada] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [cidade, setCidade] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!user) return;
    void request<{ utilizador: Perfil }>('/api/conta/perfil')
      .then(({ utilizador }) => {
        setPerfil(utilizador);
        setNome(utilizador.nome);
        setTelefone(utilizador.telefone ?? '');
        setMorada(utilizador.morada ?? '');
        setCodigoPostal(utilizador.codigo_postal ?? '');
        setCidade(utilizador.cidade ?? '');
      })
      .catch(() => setErro('Não foi possível carregar o perfil.'));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      await request('/api/conta/perfil', {
        method: 'PATCH',
        body: JSON.stringify({
          nome,
          telefone,
          morada,
          codigo_postal: codigoPostal,
          cidade,
        }),
      });
      setPerfil((prev) =>
        prev
          ? {
              ...prev,
              nome,
              telefone,
              morada,
              codigo_postal: codigoPostal,
              cidade,
            }
          : prev,
      );
      setEditing(false);
      await refresh();
      avisar('Perfil actualizado.');
    } catch {
      setErro('Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
    }
  }

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
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Perfil</h1>
        </div>
        <Link to="/conta" className="font-mono text-[11px] text-steel hover:text-acid">
          Voltar
        </Link>
      </div>

      {erro && (
        <div className="mt-6">
          <ErroBloco
            mensagem={erro}
            extra={
              <Link to="/ajuda" className="grid h-10 place-items-center font-mono text-[11px] text-acid">
                Ajuda
              </Link>
            }
          />
        </div>
      )}

      {!perfil ? (
        <p className="mt-10 font-mono text-[11px] text-steel">A carregar perfil…</p>
      ) : (
        <section className="mt-8 max-w-xl rounded-[14px] border border-line bg-panel p-6">
          {!editing ? (
            <div className="space-y-4">
              <Campo label="Nome" valor={perfil.nome} />
              <Campo label="Email" valor={perfil.email} />
              <Campo label="Telefone" valor={perfil.telefone ?? '—'} />
              <Campo label="Morada" valor={perfil.morada ?? '—'} />
              <Campo label="Código postal" valor={perfil.codigo_postal ?? '—'} />
              <Campo label="Cidade" valor={perfil.cidade ?? '—'} />
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-4 h-10 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas"
              >
                Editar
              </button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => void onSubmit(e)}
              onInvalidCapture={onInvalidPt}
              onInput={onInputPt}
            >
              <Input label="Nome" value={nome} onChange={setNome} required />
              <Input label="Email" value={perfil.email} disabled />
              <Input label="Telefone" value={telefone} onChange={setTelefone} />
              <Input label="Morada" value={morada} onChange={setMorada} />
              <Input label="Código postal (opcional)" value={codigoPostal} onChange={setCodigoPostal} />
              <Input label="Cidade ou município" value={cidade} onChange={setCidade} />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-lg bg-acid px-5 font-display text-sm font-semibold text-canvas disabled:opacity-60"
                >
                  {saving ? 'A guardar…' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="h-10 rounded-lg px-5 font-mono text-[11px] text-steel ring-1 ring-line"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </StoreShell>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">{label}</p>
      <p className="mt-1 text-ink">{valor}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">{label}</span>
      <input
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm outline-none focus:border-acid/60 disabled:text-steel"
      />
    </label>
  );
}
