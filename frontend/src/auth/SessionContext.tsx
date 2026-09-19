import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ensureCsrf, type User } from '../api/client';

interface SessionValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User | null>;
  registo: (dados: { nome: string; email: string; password: string; telefone?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void ensureCsrf()
      .catch(() => undefined)
      .then(() => refresh());
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await api.login(email, password);
    await refresh();
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as User['role'],
      phone: null,
      address: null,
      postalCode: null,
      city: null,
    };
  }, [refresh]);

  const registo = useCallback(
    async (dados: { nome: string; email: string; password: string; telefone?: string }) => {
      const { user: u } = await api.registo(dados);
      await refresh();
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as User['role'],
        phone: null,
        address: null,
        postalCode: null,
        city: null,
      };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, registo, logout }),
    [user, loading, refresh, login, registo, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession deve ser usado dentro de <SessionProvider>');
  return ctx;
}
