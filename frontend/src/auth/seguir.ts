export function caminhoSeguro(valor: string | null): string | null {
  if (!valor) return null;
  if (!valor.startsWith('/')) return null;
  if (valor.startsWith('//') || valor.includes('://')) return null;
  return valor;
}

export function destinoAposLogin(_search: string, papel: string): string {
  if (papel === 'admin') return '/admin';
  return '/conta';
}

export function urlComSeguir(base: '/login' | '/registo', search: string): string {
  const seguir = caminhoSeguro(new URLSearchParams(search).get('seguir'));
  if (!seguir) return base;
  return `${base}?seguir=${encodeURIComponent(seguir)}`;
}
