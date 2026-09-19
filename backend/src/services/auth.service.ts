import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import * as repo from '../repositories/auth.repository.js';
import type { Autenticado, Perfil } from '../types/domain.js';
import { AppError } from '../utils/errors.js';
import { isUniqueViolation } from '../utils/postgres.js';
import { emailBoasVindas, emailRecuperacao } from './email.service.js';

export const COOKIE_SESSAO = env.SESSION_COOKIE_NAME;

const DIAS_DE_SESSAO = 7;
const JANELA_MINUTOS = 15;
const FALHAS_POR_CONTA = 5;
const FALHAS_POR_IP = 20;
const INTERVALO_TOQUE_MS = 5 * 60 * 1000;

export const hashDeToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const CUSTO_BCRYPT = env.isTest ? 4 : 12;

export const hashDePassword = (password: string): Promise<string> =>
  bcrypt.hash(password, CUSTO_BCRYPT);

export interface SessaoCriada {
  readonly token: string;
  readonly expiresAt: Date;
  readonly user: {
    id: string;
    name: string;
    email: string;
    role: Perfil;
  };
}

interface DadosLogin {
  readonly email: string;
  readonly password: string;
  readonly ip: string | null;
  readonly userAgent: string | null;
}

const credenciaisInvalidas = (): AppError =>
  new AppError('UNAUTHENTICATED', 'Email ou palavra-passe incorrectos.');

export const iniciarSessao = async (dados: DadosLogin): Promise<SessaoCriada> => {
  const email = dados.email.trim().toLowerCase();
  const falhas = await repo.falhasRecentes(email, dados.ip, JANELA_MINUTOS);
  if (falhas.porEmail >= FALHAS_POR_CONTA || falhas.porIp >= FALHAS_POR_IP) {
    throw new AppError(
      'RATE_LIMITED',
      `Demasiadas tentativas falhadas. Espera ${JANELA_MINUTOS} minutos antes de tentar de novo.`,
    );
  }

  const utilizador = await repo.encontrarPorEmail(email);

  if (utilizador === null) {
    await bcrypt.compare(dados.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    await repo.registarTentativa({ email, ip: dados.ip, succeeded: false });
    throw credenciaisInvalidas();
  }

  const correcta = await bcrypt.compare(dados.password, utilizador.password_hash);
  if (!correcta) {
    await repo.registarTentativa({ email, ip: dados.ip, succeeded: false });
    throw credenciaisInvalidas();
  }

  if (!utilizador.activo) {
    throw new AppError('FORBIDDEN', 'Esta conta está desactivada.');
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + DIAS_DE_SESSAO * 24 * 60 * 60 * 1000);

  await repo.criarSessao({
    userId: utilizador.id,
    tokenHash: hashDeToken(token),
    ip: dados.ip,
    userAgent: dados.userAgent,
    expiresAt,
  });
  await repo.registarTentativa({ email, ip: dados.ip, succeeded: true });

  return {
    token,
    expiresAt,
    user: {
      id: utilizador.id,
      name: utilizador.nome,
      email: utilizador.email,
      role: utilizador.perfil,
    },
  };
};

export const terminarSessao = async (token: string | undefined): Promise<void> => {
  if (token === undefined || token.length === 0) return;
  await repo.revogarSessao(hashDeToken(token));
};

export const resolverSessao = async (token: string | undefined): Promise<Autenticado | null> => {
  if (token === undefined || token.length < 20) return null;
  const hash = hashDeToken(token);
  const sessao = await repo.encontrarSessaoActiva(hash);
  if (sessao === null) return null;

  const agora = Date.now();
  if (agora - sessao.last_seen_at.getTime() > INTERVALO_TOQUE_MS) {
    await repo.tocarSessao(sessao.id);
  }

  return {
    userId: sessao.utilizador_id,
    email: sessao.email,
    nome: sessao.nome,
    perfil: sessao.perfil,
    sessionId: sessao.id,
  };
};

/** Constant-time compare for CSRF tokens. */
export const tokensIguais = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
};

const telefoneAo = /^(\+244)?9\d{8}$/;

export const registarCliente = async (dados: {
  nome: string;
  email: string;
  password: string;
  telefone: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<SessaoCriada> => {
  const email = dados.email.trim().toLowerCase();
  const existente = await repo.encontrarPorEmail(email);
  if (existente !== null) {
    throw new AppError('CONFLICT', 'Já existe uma conta com este email. Entra ou recupera a palavra-passe.');
  }
  let telefone = dados.telefone?.replace(/[\s-]/g, '') ?? null;
  if (telefone && !telefoneAo.test(telefone)) {
    throw new AppError('VALIDATION_ERROR', 'Telemóvel angolano inválido (9 dígitos a começar por 9).');
  }
  if (telefone && !telefone.startsWith('+244')) telefone = `+244${telefone.replace(/^\+?244/, '')}`;
  const passwordHash = await hashDePassword(dados.password);
  let criado;
  try {
    criado = await repo.criarCliente({
      email,
      passwordHash,
      nome: dados.nome.trim(),
      telefone,
    });
  } catch (erro) {
    if (isUniqueViolation(erro)) {
      throw new AppError('CONFLICT', 'Já existe uma conta com este email. Entra ou recupera a palavra-passe.');
    }
    throw erro;
  }
  void emailBoasVindas(email, criado.nome);
  return iniciarSessao({
    email,
    password: dados.password,
    ip: dados.ip,
    userAgent: dados.userAgent,
  });
};

export const pedirRecuperacao = async (emailBruto: string): Promise<void> => {
  const email = emailBruto.trim().toLowerCase();
  const utilizador = await repo.encontrarPorEmail(email);
  if (utilizador === null || !utilizador.activo) return;
  const token = randomBytes(32).toString('base64url');
  await repo.guardarTokenRecuperacao(
    utilizador.id,
    hashDeToken(token),
    new Date(Date.now() + 60 * 60 * 1000),
  );
  await emailRecuperacao(email, utilizador.nome, token);
};

export const redefinirPassword = async (token: string, password: string): Promise<void> => {
  const encontrado = await repo.encontrarTokenRecuperacao(hashDeToken(token));
  if (encontrado === null) {
    throw new AppError('VALIDATION_ERROR', 'Este link já não é válido. Pede um novo.');
  }
  await repo.actualizarPassword(encontrado.utilizador_id, await hashDePassword(password));
  await repo.gastarTokenRecuperacao(encontrado.id);
};
