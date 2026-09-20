import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as enderecosRepo from '../repositories/enderecos.repository.js';
import * as favoritosRepo from '../repositories/favoritos.repository.js';
import { query } from '../config/database.js';
import { AppError } from '../utils/errors.js';

// Dashboard: resumo da conta
export const obterDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const utilizadorId = req.auth!.userId;

    const [pedidos, favoritos, cupons] = await Promise.all([
      query<{ count: string }>(
        `SELECT count(*)::text AS count FROM pedidos WHERE utilizador_id = $1`,
        [utilizadorId],
      ),
      query<{ count: string }>(
        `SELECT count(*)::text AS count FROM favoritos WHERE utilizador_id = $1`,
        [utilizadorId],
      ),
      query<{ count: string }>(
        `SELECT count(*)::text AS count
         FROM cupons_utilizador cu
         INNER JOIN cupons c ON c.id = cu.cupao_id
         WHERE cu.utilizador_id = $1 AND cu.pedido_id IS NULL
           AND c.activo = true AND c.valido_ate > now()`,
        [utilizadorId],
      ),
    ]);

    const pedidosRecentes = await query<{
      referencia: string;
      total_centimos: number;
      estado: string;
      created_at: string;
      comprovativo_url: string | null;
    }>(
      `SELECT referencia, total_centimos, estado, created_at, comprovativo_url
       FROM pedidos
       WHERE utilizador_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [utilizadorId],
    );

    res.json({
      utilizador: {
        nome: req.auth!.nome,
        email: req.auth!.email,
      },
      estatisticas: {
        pedidos: Number(pedidos.rows[0]?.count ?? 0),
        favoritos: Number(favoritos.rows[0]?.count ?? 0),
        cupons: Number(cupons.rows[0]?.count ?? 0),
      },
      pedidosRecentes: pedidosRecentes.rows.map((p) => ({
        referencia: p.referencia,
        total: p.total_centimos / 100,
        estado: p.estado,
        comprovativoUrl: p.comprovativo_url,
        data: p.created_at,
      })),
    });
  } catch (erro) {
    next(erro);
  }
};

// Perfil: obter dados do utilizador
export const obterPerfil = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await query<{
      id: string;
      email: string;
      nome: string;
      telefone: string | null;
      morada: string | null;
      codigo_postal: string | null;
      cidade: string | null;
      created_at: string;
    }>(
      `SELECT id, email, nome, telefone, morada, codigo_postal, cidade, created_at
       FROM utilizadores WHERE id = $1`,
      [req.auth!.userId],
    );

    if (rows.length === 0) {
      throw new AppError('NOT_FOUND', 'Utilizador não encontrado');
    }

    res.json({ utilizador: rows[0] });
  } catch (erro) {
    next(erro);
  }
};

// Perfil: actualizar dados
export const actualizarPerfil = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { nome, telefone, morada, codigo_postal, cidade } = req.body;

    const campos: string[] = [];
    const valores: unknown[] = [req.auth!.userId];
    let i = 2;

    if (nome !== undefined) {
      campos.push(`nome = $${i++}`);
      valores.push(nome);
    }
    if (telefone !== undefined) {
      campos.push(`telefone = $${i++}`);
      valores.push(telefone || null);
    }
    if (morada !== undefined) {
      campos.push(`morada = $${i++}`);
      valores.push(morada || null);
    }
    if (codigo_postal !== undefined) {
      campos.push(`codigo_postal = $${i++}`);
      valores.push(codigo_postal || null);
    }
    if (cidade !== undefined) {
      campos.push(`cidade = $${i++}`);
      valores.push(cidade || null);
    }

    if (campos.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Nenhuma alteração fornecida');
    }

    campos.push(`updated_at = now()`);

    await query(
      `UPDATE utilizadores SET ${campos.join(', ')} WHERE id = $1`,
      valores,
    );

    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};

// Endereços: listar
export const listarEnderecos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const enderecos = await enderecosRepo.listarEnderecos(req.auth!.userId);
    res.json({ enderecos });
  } catch (erro) {
    next(erro);
  }
};

// Endereços: criar
export const criarEndereco = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dados = z
      .object({
        nome: z.string().trim().max(80).optional(),
        destinatario: z.string().trim().min(2, 'Indica o nome de quem recebe.').max(160),
        telefone: z.string().trim().min(9, 'Indica o telemóvel.').max(40),
        morada: z.string().trim().min(3, 'Indica a morada.').max(300),
        codigo_postal: z.string().trim().max(40).optional(),
        cidade: z.string().trim().min(2, 'Indica a cidade ou município.').max(100),
        ponto_referencia: z.string().trim().max(200).optional(),
        observacoes: z.string().trim().max(400).optional(),
        principal: z.boolean().optional(),
      })
      .parse(req.body);

    const telefone = dados.telefone.replace(/[\s-]/g, '');
    if (!/^(\+244)?9\d{8}$/.test(telefone)) {
      throw new AppError('VALIDATION_ERROR', 'Telemóvel angolano inválido (9 dígitos a começar por 9).');
    }

    const endereco = await enderecosRepo.criarEndereco(req.auth!.userId, {
      nome: dados.nome && dados.nome.length > 0 ? dados.nome : 'Novo',
      destinatario: dados.destinatario,
      telefone,
      morada: dados.morada,
      codigo_postal: dados.codigo_postal && dados.codigo_postal.length > 0 ? dados.codigo_postal : null,
      cidade: dados.cidade,
      ponto_referencia: dados.ponto_referencia && dados.ponto_referencia.length > 0 ? dados.ponto_referencia : null,
      observacoes: dados.observacoes && dados.observacoes.length > 0 ? dados.observacoes : null,
      principal: dados.principal ?? false,
    });

    res.status(201).json({ endereco });
  } catch (erro) {
    next(erro);
  }
};

// Endereços: actualizar
export const actualizarEndereco = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'ID do endereço em falta');
    }
    const endereco = await enderecosRepo.actualizarEndereco(id, req.auth!.userId, req.body);

    if (!endereco) {
      throw new AppError('NOT_FOUND', 'Endereço não encontrado');
    }

    res.json({ endereco });
  } catch (erro) {
    next(erro);
  }
};

// Endereços: eliminar
export const eliminarEndereco = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'ID do endereço em falta');
    }
    const eliminado = await enderecosRepo.eliminarEndereco(id, req.auth!.userId);

    if (!eliminado) {
      throw new AppError('NOT_FOUND', 'Endereço não encontrado');
    }

    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};

// Endereços: marcar como principal
export const marcarEnderecoPrincipal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError('VALIDATION_ERROR', 'ID do endereço em falta');
    }
    await enderecosRepo.marcarPrincipal(id, req.auth!.userId);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};

// Favoritos: listar
export const listarFavoritos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const produtos = await favoritosRepo.listarFavoritos(req.auth!.userId);
    res.json({ products: produtos });
  } catch (erro) {
    next(erro);
  }
};

// Favoritos: adicionar
export const adicionarFavorito = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slug = z.string().trim().min(1).max(80).parse(req.body.slug ?? req.body.produtoId);
    await favoritosRepo.adicionarFavorito(req.auth!.userId, slug);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};

// Favoritos: remover
export const removerFavorito = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { produtoId } = req.params;
    if (!produtoId || Array.isArray(produtoId)) {
      throw new AppError('VALIDATION_ERROR', 'ID do produto em falta');
    }
    const removido = await favoritosRepo.removerFavorito(req.auth!.userId, produtoId);

    if (!removido) {
      throw new AppError('NOT_FOUND', 'Favorito não encontrado');
    }

    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
};
