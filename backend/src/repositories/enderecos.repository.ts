import { query } from '../config/database.js';

export interface Endereco {
  id: string;
  utilizador_id: string;
  nome: string;
  destinatario: string;
  telefone: string;
  morada: string;
  codigo_postal: string | null;
  cidade: string;
  ponto_referencia: string | null;
  observacoes: string | null;
  principal: boolean;
  created_at: string;
  updated_at: string;
}

export const listarEnderecos = async (utilizadorId: string): Promise<Endereco[]> => {
  const { rows } = await query<Endereco>(
    `SELECT * FROM enderecos WHERE utilizador_id = $1 ORDER BY principal DESC, created_at DESC`,
    [utilizadorId],
  );
  return rows;
};

export const obterEndereco = async (
  id: string,
  utilizadorId: string,
): Promise<Endereco | null> => {
  const { rows } = await query<Endereco>(
    `SELECT * FROM enderecos WHERE id = $1 AND utilizador_id = $2`,
    [id, utilizadorId],
  );
  return rows[0] ?? null;
};

export const criarEndereco = async (
  utilizadorId: string,
  dados: Omit<Endereco, 'id' | 'utilizador_id' | 'created_at' | 'updated_at'>,
): Promise<Endereco> => {
  const { rows } = await query<Endereco>(
    `INSERT INTO enderecos (
      utilizador_id, nome, destinatario, telefone, morada, codigo_postal,
      cidade, ponto_referencia, observacoes, principal
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      utilizadorId,
      dados.nome,
      dados.destinatario,
      dados.telefone,
      dados.morada,
      dados.codigo_postal,
      dados.cidade,
      dados.ponto_referencia,
      dados.observacoes,
      dados.principal,
    ],
  );
  return rows[0]!;
};

export const actualizarEndereco = async (
  id: string,
  utilizadorId: string,
  dados: Partial<Omit<Endereco, 'id' | 'utilizador_id' | 'created_at' | 'updated_at'>>,
): Promise<Endereco | null> => {
  const campos: string[] = [];
  const valores: unknown[] = [id, utilizadorId];
  let i = 3;

  if (dados.nome !== undefined) {
    campos.push(`nome = $${i++}`);
    valores.push(dados.nome);
  }
  if (dados.destinatario !== undefined) {
    campos.push(`destinatario = $${i++}`);
    valores.push(dados.destinatario);
  }
  if (dados.telefone !== undefined) {
    campos.push(`telefone = $${i++}`);
    valores.push(dados.telefone);
  }
  if (dados.morada !== undefined) {
    campos.push(`morada = $${i++}`);
    valores.push(dados.morada);
  }
  if (dados.codigo_postal !== undefined) {
    campos.push(`codigo_postal = $${i++}`);
    valores.push(dados.codigo_postal);
  }
  if (dados.cidade !== undefined) {
    campos.push(`cidade = $${i++}`);
    valores.push(dados.cidade);
  }
  if (dados.ponto_referencia !== undefined) {
    campos.push(`ponto_referencia = $${i++}`);
    valores.push(dados.ponto_referencia);
  }
  if (dados.observacoes !== undefined) {
    campos.push(`observacoes = $${i++}`);
    valores.push(dados.observacoes);
  }
  if (dados.principal !== undefined) {
    campos.push(`principal = $${i++}`);
    valores.push(dados.principal);
  }

  if (campos.length === 0) return obterEndereco(id, utilizadorId);

  campos.push(`updated_at = now()`);

  const { rows } = await query<Endereco>(
    `UPDATE enderecos SET ${campos.join(', ')}
     WHERE id = $1 AND utilizador_id = $2
     RETURNING *`,
    valores,
  );
  return rows[0] ?? null;
};

export const eliminarEndereco = async (id: string, utilizadorId: string): Promise<boolean> => {
  const { rowCount } = await query(
    `DELETE FROM enderecos WHERE id = $1 AND utilizador_id = $2`,
    [id, utilizadorId],
  );
  return (rowCount ?? 0) > 0;
};

export const marcarPrincipal = async (id: string, utilizadorId: string): Promise<void> => {
  await query(`BEGIN`);
  try {
    await query(`UPDATE enderecos SET principal = false WHERE utilizador_id = $1`, [utilizadorId]);
    await query(`UPDATE enderecos SET principal = true WHERE id = $1 AND utilizador_id = $2`, [
      id,
      utilizadorId,
    ]);
    await query(`COMMIT`);
  } catch (erro) {
    await query(`ROLLBACK`);
    throw erro;
  }
};
