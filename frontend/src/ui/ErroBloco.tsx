import type { ReactNode } from 'react';

export function ErroBloco({
  titulo = 'Algo correu mal',
  mensagem,
  onTentar,
  extra,
}: {
  titulo?: string;
  mensagem: string;
  onTentar?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div
      role="alert"
      tabIndex={-1}
      className="rounded-[14px] border border-destructive/40 bg-panel p-6"
    >
      <h2 className="font-display text-lg text-ink">{titulo}</h2>
      <p className="mt-2 text-sm text-zinc-400">{mensagem}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {onTentar && (
          <button
            type="button"
            onClick={onTentar}
            className="h-10 rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
          >
            Tentar outra vez
          </button>
        )}
        {extra}
      </div>
    </div>
  );
}
