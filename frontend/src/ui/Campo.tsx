import type { InputHTMLAttributes, ReactNode } from 'react';

export function Campo({
  label,
  hint,
  erro,
  id,
  children,
  ...input
}: {
  label: string;
  hint?: string;
  erro?: string;
  id: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const erroId = `${id}-erro`;
  const hintId = `${id}-hint`;
  return (
    <label className="block" htmlFor={id}>
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">{label}</span>
      {children ?? (
        <input
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={[hint ? hintId : '', erro ? erroId : ''].filter(Boolean).join(' ') || undefined}
          className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm text-ink outline-none placeholder:text-steel/70 focus:border-acid/60"
          {...input}
        />
      )}
      {hint && (
        <span id={hintId} className="mt-1 block font-mono text-[10px] text-steel">
          {hint}
        </span>
      )}
      {erro && (
        <span id={erroId} className="mt-1 block font-mono text-[11px] text-destructive">
          {erro}
        </span>
      )}
    </label>
  );
}
