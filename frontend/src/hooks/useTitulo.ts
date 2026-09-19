import { useEffect } from 'react';

export function useTitulo(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = `${titulo} · Vantagem`;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
