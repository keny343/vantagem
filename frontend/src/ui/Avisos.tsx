import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type TipoAviso = 'ok' | 'erro' | 'info';

export interface Aviso {
  id: number;
  texto: string;
  tipo: TipoAviso;
  acao?: { label: string; onClick: () => void };
}

interface AvisosValue {
  avisar: (texto: string, extra?: { tipo?: TipoAviso; acao?: Aviso['acao'] }) => void;
}

const AvisosContext = createContext<AvisosValue | null>(null);

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Aviso[]>([]);
  const seq = useRef(1);

  const fechar = useCallback((id: number) => {
    setLista((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const avisar = useCallback(
    (texto: string, extra?: { tipo?: TipoAviso; acao?: Aviso['acao'] }) => {
      const id = seq.current++;
      const aviso: Aviso = {
        id,
        texto,
        tipo: extra?.tipo ?? 'ok',
        ...(extra?.acao ? { acao: extra.acao } : {}),
      };
      setLista((prev) => [...prev.slice(-2), aviso]);
      window.setTimeout(() => fechar(id), extra?.acao ? 8000 : 4200);
    },
    [fechar],
  );

  const value = useMemo(() => ({ avisar }), [avisar]);

  return (
    <AvisosContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
        aria-relevant="additions"
      >
        {lista.map((a) => (
          <div
            key={a.id}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              a.tipo === 'erro'
                ? 'border-destructive/40 bg-panel text-ink'
                : a.tipo === 'info'
                  ? 'border-line bg-panel text-ink'
                  : 'border-acid/40 bg-panel text-ink'
            }`}
          >
            <p className="font-mono text-[12px]">{a.texto}</p>
            {a.acao && (
              <button
                type="button"
                onClick={() => {
                  a.acao?.onClick();
                  fechar(a.id);
                }}
                className="font-mono text-[11px] tracking-[0.1em] text-acid uppercase"
              >
                {a.acao.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => fechar(a.id)}
              className="font-mono text-[11px] text-steel hover:text-ink"
              aria-label="Fechar aviso"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export function useAvisos(): AvisosValue {
  const ctx = useContext(AvisosContext);
  if (!ctx) throw new Error('useAvisos fora do AvisosProvider');
  return ctx;
}
