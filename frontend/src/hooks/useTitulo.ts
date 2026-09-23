import { useEffect } from 'react';

const TITULO_MARCA = 'Vantagem | Electrónica em Angola — vantagem-one';

/** Define o <title>. Na home usa o título de marca (sem sufixo). */
export function useTitulo(titulo: string, opts?: { marca?: boolean }): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = opts?.marca ? TITULO_MARCA : `${titulo} · Vantagem`;
    return () => {
      document.title = anterior;
    };
  }, [titulo, opts?.marca]);
}
