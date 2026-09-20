import { useTheme } from '../theme/ThemeContext';

function IconeSol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.05 5.05l1.56 1.56M17.39 17.39l1.56 1.56M5.05 18.95l1.56-1.56M17.39 6.61l1.56-1.56"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeLua({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19.5 13.2A7.5 7.5 0 0 1 10.8 4.5 7.6 7.6 0 1 0 19.5 13.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TemaToggle({ className = '' }: { className?: string }) {
  const { claro, alternar } = useTheme();

  return (
    <button
      type="button"
      onClick={alternar}
      className={`grid h-9 w-9 place-items-center rounded-md bg-panel text-steel ring-1 ring-line transition-colors hover:text-acid ${className}`}
      aria-label={claro ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
      title={claro ? 'Modo escuro' : 'Modo claro'}
    >
      {claro ? <IconeLua className="size-4" /> : <IconeSol className="size-4" />}
    </button>
  );
}
