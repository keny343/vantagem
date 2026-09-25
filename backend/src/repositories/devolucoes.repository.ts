import { query } from '../config/database.js';
import { AppError } from '../utils/errors.js';

export interface Devolucao {
  id: string;
  pedido_id: string;
  utilizador_id: string;
  produto_id: string | null;
  motivo: string;
  descricao: string | null;
  fotos: string[];
  estado: 'solicitada' | 'aprovada' | 'rejeitada' | 'recebida' | 'reembolsada';
  created_at: string;
  updated_at: string;
}

export const criarDevolucao = async (
  utilizadorId: string,
  pedidoId: string,
  dados: {
    produto_id?: string;
    motivo: string;
    descricao?: string;
    fotos?: string[];
  },
): Promise<Devolucao> => {
  const { rows: pedidos } = await query<{ id: string }>(
    `SELECT id FROM pedidos WHERE id = $1 AND utilizador_id = $2 LIMIT 1`,
    [pedidoId, utilizadorId],
  );
  if (pedidos[0] === undefined) {
    throw new AppError('NOT_FOUND', 'Pedido não encontrado.');
  }

  const { rows } = await query<Devolucao>(
    `INSERT INTO devolucoes (
      utilizador_id, pedido_id, produto_id, motivo, descricao, fotos
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING *`,
    [
      utilizadorId,
      pedidoId,
      dados.produto_id ?? null,
      dados.motivo,
      dados.descricao ?? null,
      JSON.stringify(dados.fotos ?? []),
    ],
  );
  return rows[0]!;
};

export const listarDevolucoes = async (utilizadorId: string): Promise<Devolucao[]> => {
  const { rows } = await query<Devolucao>(
    `SELECT * FROM devolucoes WHERE utilizador_id = $1 ORDER BY created_at DESC`,
    [utilizadorId],
  );
  return rows;
};

export const obterDevolucao = async (
  id: string,
  utilizadorId: string,
): Promise<Devolucao | null> => {
  const { rows } = await query<Devolucao>(
    `SELECT * FROM devolucoes WHERE id = $1 AND utilizador_id = $2`,
    [id, utilizadorId],
  );
  return rows[0] ?? null;
};

export const actualizarEstadoDevolucao = async (
  id: string,
  estado: Devolucao['estado'],
): Promise<boolean> => {
  const { rowCount } = await query(
    `UPDATE devolucoes SET estado = $1, updated_at = now() WHERE id = $2`,
    [estado, id],
  );
  return (rowCount ?? 0) > 0;
};
