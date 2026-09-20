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

const urlAbsoluto = (caminho: string): string => {
  if (/^https?:\/\//i.test(caminho)) return caminho;
  if (base) return `${base}${caminho}`;
  if (typeof window !== 'undefined') return `${window.location.origin}${caminho}`;
  return caminho;
};

/** XHR avoids browser-extension fetch hooks (e.g. 200.js / M_ID). */
const xhr = (url: string, init: RequestInit): Promise<{ status: number; text: string }> =>
  new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open(init.method ?? 'GET', url, true);
    req.withCredentials = true;
    const headers = new Headers(init.headers);
    headers.forEach((valor, chave) => {
      req.setRequestHeader(chave, valor);
    });
    req.onload = () => resolve({ status: req.status, text: req.responseText ?? '' });
    req.onerror = () => reject(new TypeError('network'));
    req.ontimeout = () => reject(new TypeError('timeout'));
    const corpo = init.body;
    if (corpo instanceof FormData || typeof corpo === 'string') {
      req.send(corpo);
    } else {
      req.send(null);
    }
  });

const parseJson = (texto: string): unknown => {
  if (texto.length === 0) return null;
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new ApiError(0, {
      error: { code: 'UNEXPECTED_ERROR', message: 'Resposta inválida do servidor.' },
    });
  }
};

const lerCookie = (nome: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const partes = document.cookie.split(';');
  for (const parte of partes) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return undefined;
};

let csrfMemoria: string | undefined;
let csrfPronto: Promise<void> | null = null;

const tokenCsrf = (): string | undefined => csrfMemoria ?? lerCookie('vantagem_csrf');

/** Obtém o CSRF via JSON — o cookie da API não é visível noutro domínio (Vercel). */
export const ensureCsrf = async (): Promise<void> => {
  if (tokenCsrf()) return;
  if (csrfPronto === null) {
    csrfPronto = xhr(urlAbsoluto('/api/auth/csrf'), { method: 'GET' })
      .then(({ text }) => {
        const corpo = parseJson(text) as { csrfToken?: string } | null;
        if (typeof corpo?.csrfToken === 'string' && corpo.csrfToken.length >= 20) {
          csrfMemoria = corpo.csrfToken;
        }
      })
      .finally(() => {
        csrfPronto = null;
      });
  }
  await csrfPronto;
};

/** Prefixa fotos locais (`/uploads/...`) com o origin da API quando o SPA está noutro host. */
export const urlMedia = (caminho: string | undefined): string => {
  if (caminho === undefined || caminho.length === 0) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  if (base) return `${base}${caminho}`;
  return caminho;
};

export const request = async <T>(caminho: string, init: RequestInit = {}): Promise<T> => {
  const metodo = (init.method ?? 'GET').toUpperCase();
  if (!SAFE.has(metodo)) {
    await ensureCsrf();
  }

  const csrf = tokenCsrf();
  const multipart = init.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
    ...(csrf !== undefined ? { 'X-CSRF-Token': csrf } : {}),
  };
  if (init.headers && !(init.headers instanceof Headers)) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  let status: number;
  let texto: string;
  try {
    const res = await xhr(urlAbsoluto(caminho), {
      ...init,
      method: metodo,
      headers,
    });
    status = res.status;
    texto = res.text;
  } catch {
    throw new ApiError(0, {
      error: { code: 'NETWORK_ERROR', message: 'Sem ligação ao servidor.' },
    });
  }

  const corpo = parseJson(texto);

  if (status < 200 || status >= 300) {
    const temEnvelope =
      corpo !== null && typeof corpo === 'object' && 'error' in (corpo as Record<string, unknown>);
    throw new ApiError(
      status,
      temEnvelope
        ? (corpo as ApiErrorBody)
        : { error: { code: 'UNEXPECTED_ERROR', message: `Erro ${status}.` } },
    );
  }

  return corpo as T;
};

export interface AdminProduct extends Product {
  active: boolean;
  warrantyMonths: number | null;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  productCount: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  type: 'percentual' | 'fixo';
  value: number;
  minEuros: number;
  maxUses: number | null;
  uses: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export type ProductWrite = {
  name: string;
  brand: string;
  categorySlug: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  description: string;
  specs: string[];
  images: string[];
  variantLabel: string;
  variantOptions: string[];
  badge: string | null;
  featured: boolean;
  hero: boolean;
  sku?: string;
  slug?: string;
  warrantyMonths: number | null;
  active?: boolean;
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
  hero: boolean;
  sold: number;
  warrantyMonths: number | null;
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
  nif: string | null;
  couponCode: string | null;
  discount: number;
  vat: number;
  mbEntity: string | null;
  mbReference: string | null;
  tracking: string | null;
  paidAt: string | null;
  comprovativoUrl: string | null;
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
    productId: string | null;
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
  registo: (body: { nome: string; email: string; password: string; telefone?: string }) =>
    request<{ user: { id: string; name: string; email: string; role: string } }>('/api/auth/registo', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  recuperar: (email: string) =>
    request<{ ok: boolean }>('/api/auth/recuperar', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  redefinir: (token: string, password: string) =>
    request<{ ok: boolean }>('/api/auth/redefinir', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User | null }>('/api/auth/me'),
  criarPedido: (body: unknown) =>
    request<{ order: Order }>('/api/pedidos', { method: 'POST', body: JSON.stringify(body) }),
  enviarComprovativo: (referencia: string, ficheiro: File) => {
    const data = new FormData();
    data.append('fotografia', ficheiro);
    return request<{ order: Order }>(
      `/api/pedidos/${encodeURIComponent(referencia)}/comprovativo`,
      { method: 'POST', body: data },
    );
  },
  loja: () =>
    request<{
      paymentMode: 'demo' | 'producao';
      iban: string | null;
      legalName: string;
      nif: string;
    }>('/api/loja'),
  faq: () => request<{ faq: { id: string; categoria: string; pergunta: string; resposta: string }[] }>('/api/faq'),
  notificacoes: () =>
    request<{
      notificacoes: {
        id: string;
        tipo: string;
        titulo: string;
        mensagem: string;
        link: string | null;
        lida: boolean;
        created_at: string;
      }[];
    }>('/api/conta/notificacoes'),
  marcarNotificacao: (id: string) =>
    request<{ ok: boolean }>(`/api/conta/notificacoes/${encodeURIComponent(id)}/lida`, {
      method: 'PATCH',
    }),
  marcarNotificacoesLidas: () =>
    request<{ ok: boolean }>('/api/conta/notificacoes/lidas', { method: 'PATCH' }),
  tickets: () =>
    request<{
      tickets: {
        id: string;
        categoria: string;
        assunto: string;
        descricao: string;
        estado: string;
        pedidoReferencia: string | null;
        created_at: string;
        updated_at: string;
      }[];
    }>('/api/conta/tickets'),
  criarTicket: (body: {
    categoria: string;
    assunto: string;
    descricao: string;
    pedidoReferencia?: string;
  }) =>
    request<{ ticket: { id: string }; existente?: boolean }>('/api/conta/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  ticket: (id: string) =>
    request<{
      ticket: {
        id: string;
        categoria: string;
        assunto: string;
        descricao: string;
        estado: string;
        pedidoReferencia: string | null;
        created_at: string;
      };
      mensagens: {
        id: string;
        texto: string;
        createdAt: string;
        autorNome: string;
        papel: 'cliente' | 'admin';
      }[];
    }>(`/api/conta/tickets/${encodeURIComponent(id)}`),
  responderTicket: (id: string, mensagem: string) =>
    request<{
      mensagem: {
        id: string;
        texto: string;
        createdAt: string;
        autorNome: string;
        papel: 'cliente' | 'admin';
      };
    }>(`/api/conta/tickets/${encodeURIComponent(id)}/respostas`, {
      method: 'POST',
      body: JSON.stringify({ mensagem }),
    }),
  devolucoes: () =>
    request<{
      devolucoes: {
        id: string;
        pedido_id: string;
        motivo: string;
        descricao: string | null;
        estado: string;
        created_at: string;
      }[];
    }>('/api/conta/devolucoes'),
  criarDevolucao: (body: { pedido_id: string; produto_id?: string; motivo: string; descricao?: string }) =>
    request<{ devolucao: { id: string } }>('/api/conta/devolucoes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  avaliacoes: (produtoId: string) =>
    request<{
      avaliacoes: {
        id: string;
        estrelas_produto: number;
        comentario: string | null;
        utilizador_nome: string;
        created_at: string;
      }[];
    }>(`/api/produtos/${encodeURIComponent(produtoId)}/avaliacoes`),
  criarAvaliacao: (body: {
    produto_id: string;
    pedido_id: string;
    estrelas_produto: number;
    comentario?: string;
  }) =>
    request<{ avaliacao: { id: string } }>('/api/conta/avaliacoes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  pedido: (referencia: string) =>
    request<{ order: Order }>(`/api/pedidos/${encodeURIComponent(referencia)}`),
  meusPedidos: () => request<{ orders: Order[] }>('/api/pedidos/meus'),
  validarCupao: (codigo: string, subtotal: number) =>
    request<{
      cupao: { code: string; type: string; value: number; discount: number; minEuros: number };
    }>('/api/cupons/validar', {
      method: 'POST',
      body: JSON.stringify({ codigo, subtotal }),
    }),
  enderecos: () =>
    request<{
      enderecos: {
        id: string;
        nome: string;
        destinatario: string;
        telefone: string;
        morada: string;
        codigo_postal: string | null;
        cidade: string;
        principal: boolean;
      }[];
    }>('/api/conta/enderecos'),
  adicionarFavorito: (slug: string) =>
    request<{ ok: boolean }>('/api/conta/favoritos', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    }),
  removerFavorito: (slug: string) =>
    request<{ ok: boolean }>(`/api/conta/favoritos/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),
  favoritos: () => request<{ products: Product[] }>('/api/conta/favoritos'),
  adminPedido: (id: string) => request<{ order: Order }>(`/api/admin/pedidos/${id}`),
  adminResumo: () =>
    request<{
      products: number;
      orders: number;
      revenue: number;
      lowStock: number;
      pendingOrders: number;
      customers: number;
      openTickets: number;
      pendingProofs: number;
      lowStockItems?: { name: string; slug: string; quantity: number }[];
    }>('/api/admin/resumo'),
  adminProdutos: () => request<{ products: AdminProduct[] }>('/api/admin/produtos'),
  adminProduto: (slug: string) =>
    request<{ product: AdminProduct }>(`/api/admin/produtos/${encodeURIComponent(slug)}`),
  adminCriarProduto: (body: ProductWrite) =>
    request<{ product: AdminProduct }>('/api/admin/produtos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  adminActualizarProduto: (slug: string, body: Partial<ProductWrite>) =>
    request<{ product: AdminProduct }>(`/api/admin/produtos/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  adminCategorias: () => request<{ categories: AdminCategory[] }>('/api/admin/categorias'),
  adminCriarCategoria: (body: { name: string; slug?: string; order: number }) =>
    request<{ category: AdminCategory }>('/api/admin/categorias', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  adminActualizarCategoria: (slug: string, body: { name?: string; slug?: string; order?: number }) =>
    request<{ category: AdminCategory }>(`/api/admin/categorias/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  adminEliminarCategoria: (slug: string) =>
    request<{ ok: boolean }>(`/api/admin/categorias/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),
  adminCupons: () => request<{ coupons: AdminCoupon[] }>('/api/admin/cupons'),
  adminCriarCupao: (body: {
    code: string;
    description?: string | null;
    type: 'percentual' | 'fixo';
    value: number;
    minEuros: number;
    maxUses?: number | null;
    validUntil: string;
  }) =>
    request<{ ok: boolean }>('/api/admin/cupons', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  adminActualizarCupao: (id: string, active: boolean) =>
    request<{ ok: boolean }>(`/api/admin/cupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
  adminActualizarUtilizador: (id: string, body: { active?: boolean; role?: 'cliente' | 'admin' }) =>
    request<{ ok: boolean }>(`/api/admin/utilizadores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  adminActualizarTicket: (id: string, status: string) =>
    request<{ ok: boolean }>(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
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
        paymentMethod: string;
        hasProof: boolean;
      }[];
    }>('/api/admin/pedidos'),
  adminEstado: (id: string, status: string, tracking?: string) =>
    request<{ ok: boolean; order: Order }>(`/api/admin/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(tracking ? { status, tracking } : { status }),
    }),
  adminUploadFoto: (ficheiro: File) => {
    const data = new FormData();
    data.append('fotografia', ficheiro);
    return request<{ url: string }>('/api/admin/upload', { method: 'POST', body: data });
  },
  adminDefinirHero: (slug: string | null) =>
    request<{ ok: boolean; product: AdminProduct | null }>('/api/admin/hero', {
      method: 'PATCH',
      body: JSON.stringify({ slug }),
    }),
  adminStock: (slug: string, quantity: number) =>
    request<{ ok: boolean }>(`/api/admin/produtos/${encodeURIComponent(slug)}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  adminUtilizadores: () =>
    request<{
      users: {
        id: string;
        email: string;
        name: string;
        role: string;
        phone: string | null;
        city: string | null;
        active: boolean;
        createdAt: string;
      }[];
    }>('/api/admin/utilizadores'),
  adminTickets: () =>
    request<{
      tickets: {
        id: string;
        category: string;
        subject: string;
        description: string;
        status: string;
        priority: string;
        createdAt: string;
        updatedAt: string;
        customerName: string;
        customerEmail: string;
        pedidoReferencia: string | null;
        lastMessage: string;
        lastFrom: 'cliente' | 'admin';
      }[];
    }>('/api/admin/tickets'),
  adminTicket: (id: string) =>
    request<{
      ticket: {
        id: string;
        category: string;
        subject: string;
        description: string;
        status: string;
        pedidoReferencia: string | null;
        createdAt: string;
        customerName: string;
        customerEmail: string;
        customerId: string;
      };
      mensagens: {
        id: string;
        texto: string;
        createdAt: string;
        autorNome: string;
        papel: 'cliente' | 'admin';
      }[];
    }>(`/api/admin/tickets/${encodeURIComponent(id)}`),
  adminResponderTicket: (id: string, mensagem: string) =>
    request<{
      mensagem: {
        id: string;
        texto: string;
        createdAt: string;
        autorNome: string;
        papel: 'cliente' | 'admin';
      };
    }>(`/api/admin/tickets/${encodeURIComponent(id)}/respostas`, {
      method: 'POST',
      body: JSON.stringify({ mensagem }),
    }),
};
