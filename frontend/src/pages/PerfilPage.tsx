import { useEffect, useState, FormEvent } from 'react';
import { StoreShell } from '../layout/StoreShell';

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
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [morada, setMorada] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [cidade, setCidade] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/conta/perfil', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { utilizador: Perfil }) => {
        setPerfil(data.utilizador);
        setNome(data.utilizador.nome);
        setTelefone(data.utilizador.telefone || '');
        setMorada(data.utilizador.morada || '');
        setCodigoPostal(data.utilizador.codigo_postal || '');
        setCidade(data.utilizador.cidade || '');
      })
      .catch(console.error);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    fetch('/api/conta/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, telefone, morada, codigo_postal: codigoPostal, cidade }),
    })
      .then(() => {
        setEditing(false);
        setPerfil((prev) => (prev ? { ...prev, nome, telefone, morada, codigo_postal: codigoPostal, cidade } : null));
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  };

  if (!perfil) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-steel/20 rounded" />
          <div className="h-64 bg-steel/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <StoreShell>
      <div className="min-h-screen bg-vault">
        <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-acid">👤 Perfil</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-acid text-vault font-bold rounded hover:bg-acid/90 transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        <div className="bg-shadow border border-steel/20 p-6 rounded-lg">
          {!editing ? (
            <div className="space-y-4">
              <div>
                <p className="text-steel text-sm">Nome</p>
                <p className="text-acid font-semibold">{perfil.nome}</p>
              </div>
              <div>
                <p className="text-steel text-sm">Email</p>
                <p className="text-acid">{perfil.email}</p>
              </div>
              <div>
                <p className="text-steel text-sm">Telefone</p>
                <p className="text-acid">{perfil.telefone || '—'}</p>
              </div>
              <div>
                <p className="text-steel text-sm">Morada</p>
                <p className="text-acid">{perfil.morada || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-steel text-sm">Código Postal</p>
                  <p className="text-acid">{perfil.codigo_postal || '—'}</p>
                </div>
                <div>
                  <p className="text-steel text-sm">Cidade</p>
                  <p className="text-acid">{perfil.cidade || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-steel text-sm">Membro desde</p>
                <p className="text-acid">
                  {new Date(perfil.created_at).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-steel text-sm mb-1">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-vault border border-steel/20 rounded text-acid focus:outline-none focus:border-acid"
                />
              </div>
              <div>
                <label className="block text-steel text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={perfil.email}
                  disabled
                  className="w-full px-4 py-2 bg-vault/50 border border-steel/20 rounded text-steel cursor-not-allowed"
                />
                <p className="text-steel text-xs mt-1">O email não pode ser alterado</p>
              </div>
              <div>
                <label className="block text-steel text-sm mb-1">Telefone</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-4 py-2 bg-vault border border-steel/20 rounded text-acid focus:outline-none focus:border-acid"
                />
              </div>
              <div>
                <label className="block text-steel text-sm mb-1">Morada</label>
                <input
                  type="text"
                  value={morada}
                  onChange={(e) => setMorada(e.target.value)}
                  className="w-full px-4 py-2 bg-vault border border-steel/20 rounded text-acid focus:outline-none focus:border-acid"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-steel text-sm mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    className="w-full px-4 py-2 bg-vault border border-steel/20 rounded text-acid focus:outline-none focus:border-acid"
                  />
                </div>
                <div>
                  <label className="block text-steel text-sm mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-4 py-2 bg-vault border border-steel/20 rounded text-acid focus:outline-none focus:border-acid"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-acid text-vault font-bold rounded hover:bg-acid/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 bg-steel/20 text-steel font-bold rounded hover:bg-steel/30 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
