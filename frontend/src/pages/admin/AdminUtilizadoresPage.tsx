import { useEffect, useState } from 'react';
import { ApiError, api } from '../../api/client';
import { useSession } from '../../auth/SessionContext';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { useConfirmar } from '../../ui/Confirmar';
import { ErroBloco } from '../../ui/ErroBloco';

export function AdminUtilizadoresPage() {
  const { user } = useSession();
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  useTitulo('Utilizadores');
  const [users, setUsers] = useState<
    {
      id: string;
      email: string;
      name: string;
      role: string;
      phone: string | null;
      city: string | null;
      active: boolean;
      createdAt: string;
    }[]
  >([]);
  const [erro, setErro] = useState('');

  async function carregar() {
    const r = await api.adminUtilizadores();
    setUsers(r.users);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar os utilizadores.'));
  }, []);

  async function patch(id: string, body: { active?: boolean; role?: 'cliente' | 'admin' }, nome: string) {
    if (body.active === false) {
      const ok = await confirmar({
        titulo: 'Desactivar conta?',
        mensagem: `${nome} deixa de poder entrar na loja.`,
        confirmarLabel: 'Desactivar',
        perigo: true,
      });
      if (!ok) return;
    }
    if (body.role === 'admin') {
      const ok = await confirmar({
        titulo: 'Tornar administrador?',
        mensagem: `${nome} passa a gerir a loja e deixa de poder comprar.`,
        confirmarLabel: 'Confirmar',
      });
      if (!ok) return;
    }
    try {
      await api.adminActualizarUtilizador(id, body);
      await carregar();
      avisar('Conta actualizada.');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao actualizar utilizador.');
    }
  }

  return (
    <div>
      <p className="label-mono">Contas</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">Utilizadores</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        Activar contas e alterar perfil. Não podes deixar o sistema sem um admin.
      </p>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-[14px] border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
            <tr className="border-b border-line">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acções</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-white">{u.name}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-steel">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={u.id === user?.id}
                    onChange={(e) => void patch(u.id, { role: e.target.value as 'cliente' | 'admin' }, u.name)}
                    className="h-8 rounded-md border border-line bg-panel2 px-2 font-mono text-[11px]"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-steel">{u.active ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={u.id === user?.id}
                    onClick={() => void patch(u.id, { active: !u.active }, u.name)}
                    className="font-mono text-[10px] uppercase text-acid disabled:text-steel"
                  >
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
