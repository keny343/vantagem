import { query } from '../config/database.js';

export type CategoriaTicket =
  | 'pedido'
  | 'pagamento'
  | 'entrega'
  | 'devolucao'
  | 'produto'
  | 'conta'
  | 'outro';

export interface Ticket {
  id: string;
  utilizador_id: string;
  categoria: CategoriaTicket;
  assunto: string;
  descricao: string;
  estado: 'aberto' | 'em_analise' | 'resolvido' | 'fechado';
  prioridade: string;
  pedido_referencia: string | null;
  created_at: string;
  updated_at: string;
}

export interface RespostaTicket {
  id: string;
  ticket_id: string;
  utilizador_id: string;
  mensagem: string;
  created_at: string;
  autor_nome: string;
  autor_papel: 'cliente' | 'admin';
}

export interface TicketAdmin extends Ticket {
  cliente_nome: string;
  cliente_email: string;
  ultima_mensagem: string | null;
  ultima_papel: 'cliente' | 'admin' | null;
}

export const criarTicket = async (
  utilizadorId: string,
  dados: {
    categoria: Ticket['categoria'];
    assunto: string;
    descricao: string;
    prioridade?: string;
    pedidoReferencia?: string | null;
  },
): Promise<Ticket> => {
  const { rows } = await query<Ticket>(
    `INSERT INTO tickets (utilizador_id, categoria, assunto, descricao, prioridade, pedido_referencia)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      utilizadorId,
      dados.categoria,
      dados.assunto,
      dados.descricao,
      dados.prioridade ?? 'normal',
      dados.pedidoReferencia ?? null,
    ],
  );
  return rows[0]!;
};

export const listarTickets = async (utilizadorId: string): Promise<Ticket[]> => {
  const { rows } = await query<Ticket>(
    `SELECT * FROM tickets WHERE utilizador_id = $1 ORDER BY updated_at DESC`,
    [utilizadorId],
  );
  return rows;
};

export const obterTicket = async (id: string, utilizadorId: string): Promise<Ticket | null> => {
  const { rows } = await query<Ticket>(
    `SELECT * FROM tickets WHERE id = $1 AND utilizador_id = $2`,
    [id, utilizadorId],
  );
  return rows[0] ?? null;
};

export const obterTicketAdmin = async (id: string): Promise<TicketAdmin | null> => {
  const { rows } = await query<TicketAdmin>(
    `SELECT t.*, u.nome AS cliente_nome, u.email AS cliente_email,
            NULL::text AS ultima_mensagem, NULL::text AS ultima_papel
     FROM tickets t
     INNER JOIN utilizadores u ON u.id = t.utilizador_id
     WHERE t.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const encontrarAbertoPorPedido = async (
  utilizadorId: string,
  pedidoReferencia: string,
): Promise<Ticket | null> => {
  const { rows } = await query<Ticket>(
    `SELECT * FROM tickets
     WHERE utilizador_id = $1
       AND pedido_referencia = $2
       AND estado IN ('aberto', 'em_analise')
     ORDER BY updated_at DESC
     LIMIT 1`,
    [utilizadorId, pedidoReferencia],
  );
  return rows[0] ?? null;
};

export const responderTicket = async (
  ticketId: string,
  utilizadorId: string,
  mensagem: string,
): Promise<RespostaTicket> => {
  const { rows } = await query<RespostaTicket>(
    `INSERT INTO respostas_ticket (ticket_id, utilizador_id, mensagem)
     VALUES ($1, $2, $3)
     RETURNING id, ticket_id, utilizador_id, mensagem, created_at,
               '' AS autor_nome, 'cliente' AS autor_papel`,
    [ticketId, utilizadorId, mensagem],
  );
  const criada = rows[0]!;
  const detalhe = await query<RespostaTicket>(
    `SELECT r.id, r.ticket_id, r.utilizador_id, r.mensagem, r.created_at,
            u.nome AS autor_nome, u.perfil AS autor_papel
     FROM respostas_ticket r
     INNER JOIN utilizadores u ON u.id = r.utilizador_id
     WHERE r.id = $1`,
    [criada.id],
  );
  return detalhe.rows[0]!;
};

export const actualizarEstadoTicket = async (
  ticketId: string,
  estado: Ticket['estado'],
): Promise<void> => {
  await query(`UPDATE tickets SET estado = $1, updated_at = now() WHERE id = $2`, [
    estado,
    ticketId,
  ]);
};

export const tocarTicket = async (ticketId: string): Promise<void> => {
  await query(`UPDATE tickets SET updated_at = now() WHERE id = $1`, [ticketId]);
};

export const listarRespostasTicket = async (ticketId: string): Promise<RespostaTicket[]> => {
  const { rows } = await query<RespostaTicket>(
    `SELECT r.id, r.ticket_id, r.utilizador_id, r.mensagem, r.created_at,
            u.nome AS autor_nome, u.perfil AS autor_papel
     FROM respostas_ticket r
     INNER JOIN utilizadores u ON u.id = r.utilizador_id
     WHERE r.ticket_id = $1
     ORDER BY r.created_at ASC`,
    [ticketId],
  );
  return rows;
};

export const listarTicketsAdmin = async (): Promise<TicketAdmin[]> => {
  const { rows } = await query<TicketAdmin>(
    `SELECT t.*, u.nome AS cliente_nome, u.email AS cliente_email,
            ultima.mensagem AS ultima_mensagem,
            ultima.perfil AS ultima_papel
     FROM tickets t
     INNER JOIN utilizadores u ON u.id = t.utilizador_id
     LEFT JOIN LATERAL (
       SELECT r.mensagem, u2.perfil
       FROM respostas_ticket r
       INNER JOIN utilizadores u2 ON u2.id = r.utilizador_id
       WHERE r.ticket_id = t.id
       ORDER BY r.created_at DESC
       LIMIT 1
     ) ultima ON true
     ORDER BY t.updated_at DESC
     LIMIT 200`,
  );
  return rows;
};

export interface FAQ {
  id: string;
  categoria: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  activo: boolean;
  created_at: string;
}

export const listarFAQ = async (): Promise<FAQ[]> => {
  const { rows } = await query<FAQ>(
    `SELECT * FROM faq WHERE activo = true ORDER BY categoria ASC, ordem ASC`,
  );
  return rows;
};
