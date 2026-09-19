import { env } from '../config/env.js';
import { LOJA } from '../config/loja.js';
import { logger } from '../utils/logger.js';

export interface MensagemEmail {
  para: string;
  assunto: string;
  texto: string;
}

const remetente = (): string => env.EMAIL_FROM || LOJA.email;

const enviarSmtp = async (msg: MensagemEmail): Promise<void> => {
  const nodemailer = await import('nodemailer');
  const transporte = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
  await transporte.sendMail({
    from: `${LOJA.nome} <${remetente()}>`,
    to: msg.para,
    subject: msg.assunto,
    text: msg.texto,
  });
};

export const enviarEmail = async (msg: MensagemEmail): Promise<void> => {
  if (!msg.para.includes('@')) return;
  try {
    if (env.SMTP_HOST) {
      await enviarSmtp(msg);
      return;
    }
    logger.info('email.simulado', { para: msg.para, assunto: msg.assunto });
  } catch (erro) {
    logger.error('email.falhou', { para: msg.para, erro });
  }
};

export const emailBoasVindas = (para: string, nome: string): Promise<void> =>
  enviarEmail({
    para,
    assunto: `Bem-vindo à ${LOJA.nome}`,
    texto: `Olá ${nome},\n\nA tua conta na ${LOJA.nome} está pronta. Entra em ${env.FRONTEND_URL}/login para comprar.\n\n${LOJA.nomeLegal}`,
  });

export const emailRecuperacao = (para: string, nome: string, token: string): Promise<void> =>
  enviarEmail({
    para,
    assunto: 'Recuperar palavra-passe',
    texto: `Olá ${nome},\n\nPara escolher uma palavra-passe nova, abre este link (válido 1 hora):\n${env.FRONTEND_URL}/redefinir?token=${token}\n\nSe não pediste isto, ignora o email.\n\n${LOJA.nomeLegal}`,
  });

export const emailEncomenda = (
  para: string,
  nome: string,
  referencia: string,
  total: string,
): Promise<void> =>
  enviarEmail({
    para,
    assunto: `Encomenda ${referencia}`,
    texto: `Olá ${nome},\n\nRecebemos a encomenda ${referencia} (${total}). Acompanha o estado em:\n${env.FRONTEND_URL}/pedido/${encodeURIComponent(referencia)}\n\n${LOJA.nomeLegal}`,
  });

export const emailEstadoPedido = (
  para: string,
  nome: string,
  referencia: string,
  estado: string,
): Promise<void> =>
  enviarEmail({
    para,
    assunto: `Encomenda ${referencia}: ${estado}`,
    texto: `Olá ${nome},\n\nA encomenda ${referencia} está agora: ${estado}.\n${env.FRONTEND_URL}/pedido/${encodeURIComponent(referencia)}\n\n${LOJA.nomeLegal}`,
  });
