import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { request, ApiError } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { useConfirmar } from '../ui/Confirmar';
import { useAvisos } from '../ui/Avisos';
import { ErroBloco } from '../ui/ErroBloco';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

interface Endereco {
  id: string;
  nome: string;
  destinatario: string;
  telefone: string;
  morada: string;
  codigo_postal: string | null;
  cidade: string;
  ponto_referencia: string | null;
  observacoes: string | null;
  principal: boolean;
}

const vazio = {
  nome: 'Casa',
  destinatario: '',
  telefone: '',
  morada: '',
  codigo_postal: '',
  cidade: '',
};

export default function EnderecosPage() {
  const { user, loading: sessionLoading } = useSession();
  const [lista, setLista] = useState<Endereco[]>([]);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirmar } = useConfirmar();
  const { avisar } = useAvisos();
  useTitulo('Moradas');

  async function carregar() {
    const res = await request<{ enderecos: Endereco[] }>('/api/conta/enderecos');
    setLista(res.enderecos);
  }

  useEffect(() => {
    if (!user) return;
    void carregar().catch(() => setErro('Não foi possível carregar os endereços.'));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      await request('/api/conta/enderecos', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm(vazio);
      avisar('Endereço guardado.');
      await carregar();
    } catch (err) {
      if (err instanceof ApiError) {
        const extra = err.details?.map((d) => d.message).join(' ') ?? '';
        setErro(`${err.message}${extra ? ` ${extra}` : ''}`);
      } else {
        setErro('Não foi possível guardar o endereço.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id: string) {
    const ok = await confirmar({
      titulo: 'Eliminar morada',
      mensagem: 'Esta morada deixa de estar disponível no checkout.',
      confirmarLabel: 'Eliminar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await request(`/api/conta/enderecos/${id}`, { method: 'DELETE' });
      setLista((prev) => prev.filter((x) => x.id !== id));
      avisar('Morada eliminada.');
    } catch {
      setErro('Não foi possível eliminar o endereço. Tenta outra vez.');
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
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Endereços</h1>
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          {lista.length === 0 && (
            <p className="font-mono text-[11px] text-steel">Ainda não tens endereços guardados.</p>
          )}
          {lista.map((e) => (
            <article key={e.id} className="rounded-[14px] border border-line bg-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-ink">{e.nome}</p>
                  <p className="mt-1 text-sm text-ink/70">{e.destinatario}</p>
                  <p className="mt-1 font-mono text-[11px] text-steel">
                    {e.morada}
                    {e.codigo_postal ? `, ${e.codigo_postal}` : ''} · {e.cidade}
                  </p>
                </div>
                {e.principal && (
                  <span className="font-mono text-[10px] tracking-[0.12em] text-acid uppercase">
                    Principal
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void eliminar(e.id)}
                className="mt-4 font-mono text-[10px] tracking-[0.12em] text-steel uppercase hover:text-destructive"
              >
                Eliminar
              </button>
            </article>
          ))}
        </section>

        <form
          onSubmit={(e) => void onSubmit(e)}
          onInvalidCapture={onInvalidPt}
          onInput={onInputPt}
          className="rounded-[14px] border border-line bg-panel p-6 space-y-3"
        >
          <h2 className="font-display text-lg text-ink">Novo endereço</h2>
          <Campo label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <Campo
            label="Destinatário"
            value={form.destinatario}
            onChange={(v) => setForm({ ...form, destinatario: v })}
            required
          />
          <Campo
            label="Telemóvel"
            value={form.telefone}
            onChange={(v) => setForm({ ...form, telefone: v })}
            required
          />
          <Campo
            label="Morada"
            value={form.morada}
            onChange={(v) => setForm({ ...form, morada: v })}
            required
          />
          <Campo
            label="Código postal (opcional)"
            value={form.codigo_postal}
            onChange={(v) => setForm({ ...form, codigo_postal: v })}
          />
          <Campo
            label="Cidade ou município"
            value={form.cidade}
            onChange={(v) => setForm({ ...form, cidade: v })}
            required
          />
          <button
            disabled={saving}
            className="mt-2 h-10 w-full rounded-lg bg-acid font-display text-sm font-semibold text-canvas disabled:opacity-60"
          >
            {saving ? 'A guardar…' : 'Adicionar'}
          </button>
        </form>
      </div>
    </StoreShell>
  );
}

function Campo({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm outline-none focus:border-acid/60"
      />
    </label>
  );
}
