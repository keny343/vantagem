import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface Pedido {
  titulo: string;
  mensagem: string;
  confirmarLabel?: string;
  perigo?: boolean;
  resolve: (ok: boolean) => void;
}

interface ConfirmarValue {
  confirmar: (opts: Omit<Pedido, 'resolve'>) => Promise<boolean>;
}

const ConfirmarContext = createContext<ConfirmarValue | null>(null);

export function ConfirmarProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const tituloId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);

  const confirmar = useCallback((opts: Omit<Pedido, 'resolve'>) => {
    return new Promise<boolean>((resolve) => {
      setPedido({ ...opts, resolve });
    });
  }, []);

  function fechar(ok: boolean) {
    pedido?.resolve(ok);
    setPedido(null);
  }

  useEffect(() => {
    if (!pedido) return;
    botaoRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pedido]);

  return (
    <ConfirmarContext.Provider value={{ confirmar }}>
      {children}
      {pedido && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Cancelar"
            onClick={() => fechar(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            className="relative w-full max-w-md rounded-[14px] border border-line bg-panel p-6"
          >
            <h2 id={tituloId} className="font-display text-lg font-semibold text-white">
              {pedido.titulo}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{pedido.mensagem}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => fechar(false)}
                className="h-11 rounded-lg px-4 font-mono text-[11px] tracking-[0.12em] text-zinc-300 uppercase ring-1 ring-line"
              >
                Cancelar
              </button>
              <button
                ref={botaoRef}
                type="button"
                onClick={() => fechar(true)}
                className={`h-11 rounded-lg px-4 font-display text-sm font-semibold ${
                  pedido.perigo ? 'bg-destructive text-white' : 'bg-acid text-ink'
                }`}
              >
                {pedido.confirmarLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmarContext.Provider>
  );
}

export function useConfirmar(): ConfirmarValue {
  const ctx = useContext(ConfirmarContext);
  if (!ctx) throw new Error('useConfirmar fora do ConfirmarProvider');
  return ctx;
}
