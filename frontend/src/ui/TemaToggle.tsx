import { useTheme } from '../theme/ThemeContext';

export function TemaToggle({ className = '' }: { className?: string }) {
  const { claro, alternar } = useTheme();

  return (
    <button
      type="button"
      onClick={alternar}
      className={`h-9 rounded-md bg-panel px-3 font-mono text-[11px] tracking-[0.12em] text-steel uppercase ring-1 ring-line transition-colors hover:text-acid ${className}`}
      aria-label={claro ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
      title={claro ? 'Modo escuro' : 'Modo claro'}
    >
      {claro ? 'Escuro' : 'Claro'}
    </button>
  );
}
