import type { Request, Response } from 'express';
import { z } from 'zod';
import { lerSessao } from '../middleware/authenticate.js';
import * as pedidos from '../services/pedidos.service.js';
import { descontoDeCupao, LOJA } from '../config/loja.js';
import { eurosDeCentimos } from '../types/domain.js';
import * as engagement from '../repositories/engagement.repository.js';
import { emailEncomenda } from '../services/email.service.js';
import { guardarFicheiro } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';

const itemSchema = z.object({
  productId: z.string().trim().min(1).max(80),
  variant: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(99),
});

const nifAo = /^\d{9,10}$/;
const telefoneAo = /^(\+244)?9\d{8}$/;

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1, 'O cesto está vazio.').max(40),
  customer: z.object({
    name: z.string().trim().min(2, 'Indica o nome completo.').max(160),
    email: z.string().trim().email('Indica um email válido.').max(200),
    phone: z.string().trim().min(9, 'Indica o telemóvel.').max(40),
    address: z.string().trim().min(3, 'Indica a morada.').max(300),
    postalCode: z.string().trim().max(40).optional(),
    city: z.string().trim().min(2, 'Indica a cidade ou município.').max(100),
    nif: z.string().trim().max(10).optional(),
  }),
  paymentMethod: z.literal('cartao', {
    errorMap: () => ({ message: 'De momento só aceitamos transferência bancária.' }),
  }),
  couponCode: z.string().trim().max(40).optional(),
  idempotencyKey: z
    .string()
    .trim()
    .min(8, 'Chave de idempotência em falta.')
    .max(80),
});

export const criarPedido = async (req: Request, res: Response): Promise<void> => {
  const dados = checkoutSchema.parse(req.body);
  const postal = (dados.customer.postalCode ?? '').trim();
  const phone = dados.customer.phone.replace(/[\s-]/g, '');
  if (!telefoneAo.test(phone)) {
    throw new AppError('VALIDATION_ERROR', 'Telemóvel angolano inválido (9 dígitos a começar por 9, com ou sem +244).', {
      details: [{ field: 'phone', message: phone }],
    });
  }
  const nif = dados.customer.nif?.replace(/\s/g, '');
  if (nif !== undefined && nif.length > 0 && !nifAo.test(nif)) {
    throw new AppError('VALIDATION_ERROR', 'O NIF deve ter 9 ou 10 dígitos.', {
      details: [{ field: 'nif', message: nif }],
    });
  }

  const sessao = await lerSessao(req);
  if (!sessao) {
    throw new AppError('UNAUTHENTICATED', 'Entra na tua conta para concluir a encomenda.');
  }
  if (sessao.perfil === 'admin') {
    throw new AppError(
      'FORBIDDEN',
      'A conta de administrador não faz compras. Entra com uma conta de cliente para encomendar.',
    );
  }
  const pedido = await pedidos.criarPedido({
    items: dados.items,
    customer: {
      name: dados.customer.name,
      email: dados.customer.email.toLowerCase(),
      phone,
      address: dados.customer.address,
      postalCode: postal.length > 0 ? postal : '—',
      city: dados.customer.city,
      ...(nif !== undefined && nif.length > 0 ? { nif } : {}),
    },
    paymentMethod: dados.paymentMethod,
    userId: sessao?.userId ?? null,
    ...(dados.couponCode !== undefined && dados.couponCode.length > 0
      ? { couponCode: dados.couponCode }
      : {}),
    idempotencyKey: dados.idempotencyKey,
  });
  const totalTxt = `${pedido.total.toLocaleString('pt-AO')} Kz`;
  void emailEncomenda(pedido.customer.email, pedido.customer.name, pedido.reference, totalTxt);
  if (sessao?.userId) {
    void engagement.criarNotificacao(
      sessao.userId,
      'pedido',
      'Encomenda criada',
      `${pedido.reference} · ${totalTxt}`,
      `/pedido/${pedido.reference}`,
    );
  }
  res.status(201).json({ order: pedido });
};

export const enviarComprovativo = async (req: Request, res: Response): Promise<void> => {
  const referencia = z.string().trim().min(3).max(40).parse(req.params.referencia);
  const sessao = await lerSessao(req);
  if (!sessao) {
    throw new AppError('UNAUTHENTICATED', 'Entra na tua conta para enviar o comprovativo.');
  }
  if (req.file === undefined || !req.file.buffer) {
    throw new AppError('VALIDATION_ERROR', 'Envia o PDF do comprovativo.');
  }
  const { validarUploadComprovativo } = await import('./upload.controller.js');
  validarUploadComprovativo(req);
  const url = await guardarFicheiro(
    {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    },
    'comprovativos',
  );
  const pedido = await pedidos.guardarComprovativo(referencia, url, {
    userId: sessao.userId,
    perfil: sessao.perfil,
  });
  res.json({ order: pedido });
};

export const meusPedidos = async (req: Request, res: Response): Promise<void> => {
  if (req.auth === undefined) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Precisas de iniciar sessão.' } });
    return;
  }
  const lista = await pedidos.pedidosDoUtilizador(req.auth.userId);
  res.json({ orders: lista });
};

export const obterPedido = async (req: Request, res: Response): Promise<void> => {
  const referencia = z.string().trim().min(3).max(40).parse(req.params.referencia);
  const sessao = await lerSessao(req);
  const pedido = await pedidos.obterPorReferenciaAutorizado(
    referencia,
    sessao
      ? { userId: sessao.userId, perfil: sessao.perfil }
      : null,
  );
  res.json({ order: pedido });
};

const cupaoSchema = z.object({
  codigo: z.string().trim().min(2).max(40),
  subtotal: z.number().min(0).optional(),
});

export const validarCupao = async (req: Request, res: Response): Promise<void> => {
  const { codigo, subtotal } = cupaoSchema.parse(req.body);
  const cupao = await engagement.validarCupao(codigo);
  if (cupao === null) {
    throw new AppError('NOT_FOUND', 'Cupão inválido ou expirado.');
  }
  const subtotalCentimos = Math.round((subtotal ?? 0) * 100);
  if (subtotal !== undefined && subtotalCentimos < cupao.minimo_centimos) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Mínimo de compra ${eurosDeCentimos(cupao.minimo_centimos).toLocaleString('pt-AO')} Kz.`,
    );
  }
  const discount = eurosDeCentimos(
    descontoDeCupao(cupao.tipo, cupao.valor, subtotalCentimos || cupao.minimo_centimos),
  );
  res.json({
    cupao: {
      code: cupao.codigo,
      type: cupao.tipo,
      value: cupao.valor,
      discount,
      minEuros: eurosDeCentimos(cupao.minimo_centimos),
    },
  });
};

export const dadosLoja = (_req: Request, res: Response): void => {
  res.json({
    name: LOJA.nome,
    legalName: LOJA.nomeLegal,
    nif: LOJA.nif,
    address: LOJA.morada,
    email: LOJA.email,
    phone: LOJA.telefone,
    country: LOJA.pais,
    shipping: {
      flat: eurosDeCentimos(LOJA.custoEnvioCentimos),
      freeFrom: eurosDeCentimos(LOJA.envioGratisAPartirCentimos),
    },
    vatRate: LOJA.taxaIva,
    vatIncluded: true,
    returnsDays: LOJA.diasDevolucao,
    defaultWarrantyMonths: LOJA.garantiaMesesPadrao,
    paymentMode: LOJA.pagamentoModo,
    iban: LOJA.iban || null,
  });
};
