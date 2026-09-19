import { query } from '../config/database.js';

export interface Avaliacao {
  id: string;
  produto_id: string;
  utilizador_id: string;
  pedido_id: string;
  estrelas_produto: number;
  estrelas_entrega: number | null;
  comentario: string | null;
  fotos: string[];
  verificada: boolean;
  created_at: string;
  updated_at: string;
}

export const criarAvaliacao = async (
  utilizadorId: string,
  produtoId: string,
  pedidoId: string,
  dados: {
    estrelas_produto: number;
    estrelas_entrega?: number;
    comentario?: string;
    fotos?: string[];
  },
): Promise<Avaliacao> => {
  const { rows } = await query<Avaliacao>(
    `INSERT INTO avaliacoes (
      utilizador_id, produto_id, pedido_id,
      estrelas_produto, estrelas_entrega, comentario, fotos, verificada
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true)
    RETURNING *`,
    [
      utilizadorId,
      produtoId,
      pedidoId,
      dados.estrelas_produto,
      dados.estrelas_entrega ?? null,
      dados.comentario ?? null,
      JSON.stringify(dados.fotos ?? []),
    ],
  );
  return rows[0]!;
};

export const listarAvaliacoesProduto = async (
  produtoId: string,
): Promise<
  Array<
    Avaliacao & {
      utilizador_nome: string;
    }
  >
> => {
  const { rows } = await query<
    Avaliacao & {
      utilizador_nome: string;
    }
  >(
    `SELECT a.*, u.nome AS utilizador_nome
     FROM avaliacoes a
     INNER JOIN utilizadores u ON u.id = a.utilizador_id
     WHERE a.produto_id = $1 AND a.verificada = true
     ORDER BY a.created_at DESC`,
    [produtoId],
  );
  return rows;
};

export const verificarPodeAvaliar = async (
  utilizadorId: string,
  produtoId: string,
  pedidoId: string,
): Promise<boolean> => {
  // Verifica se o pedido foi entregue e se o produto faz parte do pedido
  const { rows } = await query<{ pode: boolean }>(
    `SELECT EXISTS(
      SELECT 1
      FROM pedidos p
      INNER JOIN itens_de_pedido i ON i.pedido_id = p.id
      WHERE p.id = $1
        AND p.utilizador_id = $2
        AND i.produto_id = $3
        AND p.estado = 'entregue'
        AND NOT EXISTS(
          SELECT 1 FROM avaliacoes a
          WHERE a.utilizador_id = $2 AND a.produto_id = $3 AND a.pedido_id = $1
        )
    ) AS pode`,
    [pedidoId, utilizadorId, produtoId],
  );
  return rows[0]?.pode ?? false;
};
