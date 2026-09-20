import { query } from '../config/database.js';
import { notFound } from '../utils/errors.js';

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

/** A API pública expõe o slug como `id`; na BD o FK é UUID. */
const resolverProdutoId = async (slugOuId: string): Promise<string> => {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM produtos
     WHERE slug = $1 OR id::text = $1
     LIMIT 1`,
    [slugOuId],
  );
  const produto = rows[0];
  if (produto === undefined) throw notFound('Produto');
  return produto.id;
};

export const criarAvaliacao = async (
  utilizadorId: string,
  produtoRef: string,
  pedidoId: string,
  dados: {
    estrelas_produto: number;
    estrelas_entrega?: number;
    comentario?: string;
    fotos?: string[];
  },
): Promise<Avaliacao> => {
  const produtoId = await resolverProdutoId(produtoRef);
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
  produtoRef: string,
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
     INNER JOIN produtos p ON p.id = a.produto_id
     WHERE (p.slug = $1 OR p.id::text = $1) AND a.verificada = true
     ORDER BY a.created_at DESC`,
    [produtoRef],
  );
  return rows;
};

export const verificarPodeAvaliar = async (
  utilizadorId: string,
  produtoRef: string,
  pedidoId: string,
): Promise<boolean> => {
  const produtoId = await resolverProdutoId(produtoRef);
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
