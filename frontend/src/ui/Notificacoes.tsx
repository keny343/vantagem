import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSession } from '../auth/SessionContext';
import { eAdmin } from '../auth/papeis';

export function Notificacoes() {
  const { user } = useSession();
  const [aberta, setAberta] = useState(false);
  const [lista, setLista] = useState<
    { id: string; titulo: string; mensagem: string; link: string | null; lida: boolean; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!user || eAdmin(user)) return;
    void api
      .notificacoes()
      .then((r) => setLista(r.notificacoes))
      .catch(() => undefined);
  }, [user]);

  if (!user || eAdmin(user)) return null;
  const porLer = lista.filter((n) => !n.lida).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        className="relative hidden h-9 rounded-md px-3 font-mono text-[11px] tracking-[0.12em] text-steel uppercase ring-1 ring-line hover:text-acid sm:block"
        aria-label="Notificações"
      >
        Avisos
        {porLer > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-acid px-1 text-[10px] text-ink">
            {porLer}
          </span>
        )}
      </button>
      {aberta && (
        <div className="absolute right-0 z-[60] mt-2 w-80 rounded-[14px] border border-line bg-panel p-3 shadow-xl">
          <div className="mb-2 flex justify-between">
            <p className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Avisos</p>
            {porLer > 0 && (
              <button
                type="button"
                className="font-mono text-[10px] text-acid"
                onClick={() => {
                  void api.marcarNotificacoesLidas().then(() => {
                    setLista((prev) => prev.map((n) => ({ ...n, lida: true })));
                  });
                }}
              >
                Marcar lidos
              </button>
            )}
          </div>
          {lista.length === 0 && <p className="font-mono text-[11px] text-steel">Sem avisos.</p>}
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {lista.slice(0, 8).map((n) => (
              <li key={n.id}>
                <Link
                  to={n.link ?? '/conta'}
                  onClick={() => {
                    if (!n.lida) void api.marcarNotificacao(n.id);
                    setAberta(false);
                  }}
                  className="block rounded-lg p-2 hover:bg-white/5"
                >
                  <p className={`text-sm ${n.lida ? 'text-zinc-400' : 'text-white'}`}>{n.titulo}</p>
                  <p className="font-mono text-[10px] text-steel">{n.mensagem}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
