import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSession } from './SessionContext';
import type { User } from '../api/client';

export const eAdmin = (user: User | null | undefined): boolean => user?.role === 'admin';

export function ContaDeCliente({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink font-mono text-steel">
        A carregar…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (eAdmin(user)) return <Navigate to="/admin" replace />;
  return children;
}

export function SemCompraDeAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return children;
  if (eAdmin(user)) return <Navigate to="/" replace />;
  return children;
}
