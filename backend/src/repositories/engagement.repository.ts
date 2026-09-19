import { query } from '../config/database.js';

export interface Cupao {
  id: string;
  codigo: string;
  descricao: string | null;
  tipo: 'percentual' | 'fixo';
  valor: number;
  minimo_centimos: number;
  maximo_utilizacoes: number | null;
  utilizacoes: number;
  valido_de: string;
  valido_ate: string;
  activo: boolean;
  created_at: string;
}

export const listarCuponsUtilizador = async (utilizadorId: string): Promise<Cupao[]> => {
  const { rows } = await query<Cupao>(
    `SELECT c.*
     FROM cupons c
     INNER JOIN cupons_utilizador cu ON cu.cupao_id = c.id
     WHERE cu.utilizador_id = $1 AND cu.pedido_id IS NULL
       AND c.activo = true AND c.valido_ate > now()
     ORDER BY c.valido_ate ASC`,
    [utilizadorId],
  );
  return rows;
};

export const validarCupao = async (
  codigo: string,
): Promise<Cupao | null> => {
  const { rows } = await query<Cupao>(
    `SELECT * FROM cupons
     WHERE lower(codigo) = lower($1)
       AND activo = true
       AND now() BETWEEN valido_de AND valido_ate
       AND (maximo_utilizacoes IS NULL OR utilizacoes < maximo_utilizacoes)`,
    [codigo],
  );
  return rows[0] ?? null;
};

export const aplicarCupao = async (
  cupaoId: string,
  utilizadorId: string,
  pedidoId: string,
): Promise<void> => {
  await query(
    `INSERT INTO cupons_utilizador (cupao_id, utilizador_id, pedido_id)
     VALUES ($1, $2, $3)`,
    [cupaoId, utilizadorId, pedidoId],
  );
  await query(`UPDATE cupons SET utilizacoes = utilizacoes + 1 WHERE id = $1`, [cupaoId]);
};

export interface Notificacao {
  id: string;
  utilizador_id: string;
  tipo:
    | 'pedido'
    | 'pagamento'
    | 'envio'
    | 'entrega'
    | 'promocao'
    | 'cupao'
    | 'preco'
    | 'stock'
    | 'mensagem'
    | 'sistema';
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  created_at: string;
}

export const listarNotificacoes = async (
  utilizadorId: string,
  limite = 50,
): Promise<Notificacao[]> => {
  const { rows } = await query<Notificacao>(
    `SELECT * FROM notificacoes WHERE utilizador_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [utilizadorId, limite],
  );
  return rows;
};

export const marcarComoLida = async (id: string, utilizadorId: string): Promise<boolean> => {
  const { rowCount } = await query(
    `UPDATE notificacoes SET lida = true WHERE id = $1 AND utilizador_id = $2`,
    [id, utilizadorId],
  );
  return (rowCount ?? 0) > 0;
};

export const criarNotificacao = async (
  utilizadorId: string,
  tipo: Notificacao['tipo'],
  titulo: string,
  mensagem: string,
  link?: string,
): Promise<Notificacao> => {
  const { rows } = await query<Notificacao>(
    `INSERT INTO notificacoes (utilizador_id, tipo, titulo, mensagem, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [utilizadorId, tipo, titulo, mensagem, link ?? null],
  );
  return rows[0]!;
};
