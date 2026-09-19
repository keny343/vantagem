import { query } from '../config/database.js';

export interface Ticket {
  id: string;
  utilizador_id: string;
  categoria: 'pedido' | 'pagamento' | 'entrega' | 'devolucao' | 'produto' | 'conta' | 'outro';
  assunto: string;
  descricao: string;
  estado: 'aberto' | 'em_analise' | 'resolvido' | 'fechado';
  prioridade: string;
  created_at: string;
  updated_at: string;
}

export interface RespostaTicket {
  id: string;
  ticket_id: string;
  utilizador_id: string;
  mensagem: string;
  created_at: string;
}

export const criarTicket = async (
  utilizadorId: string,
  dados: {
    categoria: Ticket['categoria'];
    assunto: string;
    descricao: string;
    prioridade?: string;
  },
): Promise<Ticket> => {
  const { rows } = await query<Ticket>(
    `INSERT INTO tickets (utilizador_id, categoria, assunto, descricao, prioridade)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [utilizadorId, dados.categoria, dados.assunto, dados.descricao, dados.prioridade ?? 'normal'],
  );
  return rows[0]!;
};

export const listarTickets = async (utilizadorId: string): Promise<Ticket[]> => {
  const { rows } = await query<Ticket>(
    `SELECT * FROM tickets WHERE utilizador_id = $1 ORDER BY created_at DESC`,
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

export const responderTicket = async (
  ticketId: string,
  utilizadorId: string,
  mensagem: string,
): Promise<RespostaTicket> => {
  const { rows } = await query<RespostaTicket>(
    `INSERT INTO respostas_ticket (ticket_id, utilizador_id, mensagem)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ticketId, utilizadorId, mensagem],
  );
  return rows[0]!;
};

export const listarRespostasTicket = async (ticketId: string): Promise<RespostaTicket[]> => {
  const { rows } = await query<RespostaTicket>(
    `SELECT * FROM respostas_ticket WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [ticketId],
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
