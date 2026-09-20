import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Tema = 'dark' | 'light';

const STORAGE_KEY = 'vantagem-tema';

type ThemeContextValue = {
  tema: Tema;
  setTema: (tema: Tema) => void;
  alternar: () => void;
  claro: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function lerTemaInicial(): Tema {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
  }
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado === 'light' || guardado === 'dark') return guardado;
  } catch {
    /* ignore */
  }
  return 'dark';
}

function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute('data-theme', tema);
  document.documentElement.style.colorScheme = tema === 'dark' ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', tema === 'dark' ? '#0e0f12' : '#ede6da');
  }
  try {
    localStorage.setItem(STORAGE_KEY, tema);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(lerTemaInicial);

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const setTema = useCallback((proximo: Tema) => {
    setTemaState(proximo);
  }, []);

  const alternar = useCallback(() => {
    setTemaState((atual) => (atual === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      tema,
      setTema,
      alternar,
      claro: tema === 'light',
    }),
    [tema, setTema, alternar],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme fora de ThemeProvider');
  return ctx;
}
