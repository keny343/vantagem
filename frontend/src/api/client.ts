export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: { field: string; message: string }[];
  };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: { field: string; message: string }[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error.code;
    if (body.error.requestId !== undefined) this.requestId = body.error.requestId;
    if (body.error.details !== undefined) this.details = body.error.details;
  }
}

const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ?? '';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

const lerCookie = (nome: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const partes = document.cookie.split(';');
  for (const parte of partes) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return undefined;
};

let csrfPronto: Promise<void> | null = null;

/** Fetches a CSRF cookie before the first mutating request. */
export const ensureCsrf = async (): Promise<void> => {
  if (lerCookie('vantagem_csrf')) return;
  if (csrfPronto === null) {
    csrfPronto = fetch(`${base}/api/auth/csrf`, { credentials: 'include' })
      .then(() => undefined)
      .finally(() => {
        csrfPronto = null;
      });
  }
  await csrfPronto;
};

export const request = async <T>(caminho: string, init: RequestInit = {}): Promise<T> => {
  const metodo = (init.method ?? 'GET').toUpperCase();
  if (!SAFE.has(metodo)) {
    await ensureCsrf();
  }

  const csrf = lerCookie('vantagem_csrf');
  let resposta: Response;
  try {
    resposta = await fetch(`${base}${caminho}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(csrf !== undefined ? { 'X-CSRF-Token': csrf } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, {
      error: { code: 'NETWORK_ERROR', message: 'Sem ligação ao servidor.' },
    });
  }

  const texto = await resposta.text();
  const corpo: unknown = texto.length > 0 ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const temEnvelope =
      corpo !== null && typeof corpo === 'object' && 'error' in (corpo as Record<string, unknown>);
    throw new ApiError(
      resposta.status,
      temEnvelope
        ? (corpo as ApiErrorBody)
        : { error: { code: 'UNEXPECTED_ERROR', message: `Erro ${resposta.status}.` } },
    );
  }

  return corpo as T;
};

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  specs: string[];
  variants: { label: string; options: string[] };
  images: string[];
  description: string;
  badge: string | null;
  featured: boolean;
  sold: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cliente' | 'admin';
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
}

export interface Order {
  id: string;
  reference: string;
  status: string;
  paymentMethod: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address: string;
    postalCode: string;
    city: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: {
    sku: string;
    name: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export const api = {
  categorias: () =>
    request<{ categorias: { slug: string; name: string; order: number }[] }>('/api/categorias'),
  marcas: () => request<{ brands: string[] }>('/api/marcas'),
  produtos: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<{ products: Product[]; count: number }>(`/api/produtos${suffix}`);
  },
  produto: (slug: string) =>
    request<{ product: Product; related: Product[] }>(`/api/produtos/${encodeURIComponent(slug)}`),
  login: (email: string, password: string) =>
    request<{ user: { id: string; name: string; email: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User | null }>('/api/auth/me'),
  criarPedido: (body: unknown) =>
    request<{ order: Order }>('/api/pedidos', { method: 'POST', body: JSON.stringify(body) }),
  meusPedidos: () => request<{ orders: Order[] }>('/api/pedidos/meus'),
  adminResumo: () =>
    request<{ products: number; orders: number; revenue: number; lowStock: number }>(
      '/api/admin/resumo',
    ),
  adminProdutos: () => request<{ products: Product[] }>('/api/admin/produtos'),
  adminPedidos: () =>
    request<{
      orders: {
        id: string;
        reference: string;
        status: string;
        customerName: string;
        customerEmail: string;
        total: number;
        createdAt: string;
      }[];
    }>('/api/admin/pedidos'),
  adminEstado: (id: string, status: string) =>
    request<{ ok: boolean }>(`/api/admin/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  adminStock: (slug: string, quantity: number) =>
    request<{ ok: boolean }>(`/api/admin/produtos/${encodeURIComponent(slug)}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
};
