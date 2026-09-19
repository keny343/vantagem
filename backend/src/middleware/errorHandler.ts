import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError, ERROR_CODES, type ErrorCode, type ErrorDetail } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface CorpoErro {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: readonly ErrorDetail[];
  };
}

const doZod = (erro: ZodError): AppError =>
  new AppError('VALIDATION_ERROR', 'Dados inválidos.', {
    details: erro.issues.map((issue) => ({
      field: issue.path.join('.') || '(corpo)',
      message: issue.message,
    })),
  });

const jsonMalformado = (erro: unknown): boolean =>
  erro instanceof SyntaxError && 'body' in erro && (erro as { status?: number }).status === 400;

const traduzir = (erro: unknown): AppError => {
  if (erro instanceof AppError) return erro;
  if (erro instanceof ZodError) return doZod(erro);
  if (jsonMalformado(erro)) return new AppError('VALIDATION_ERROR', 'JSON inválido no corpo do pedido.');
  if (erro instanceof Error && 'type' in erro && erro.type === 'entity.too.large') {
    return new AppError('PAYLOAD_TOO_LARGE', 'Corpo do pedido demasiado grande.');
  }
  if (erro instanceof Error && erro.message.startsWith('Só são aceites fotografias')) {
    return new AppError('VALIDATION_ERROR', erro.message);
  }
  if (erro instanceof Error && 'code' in erro && (erro as { code: string }).code === 'LIMIT_FILE_SIZE') {
    return new AppError('PAYLOAD_TOO_LARGE', 'A fotografia não pode ter mais de 5 MB.');
  }
  return new AppError('INTERNAL_ERROR', 'Erro interno.', { cause: erro });
};

export const errorHandler = (
  erro: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(erro);
    return;
  }

  const app = traduzir(erro);
  const original = app.cause ?? erro;

  logger.error('request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    code: app.code,
    status: app.status,
    stack: original instanceof Error ? original.stack : String(original),
  });

  const corpo: CorpoErro = {
    error: {
      code: app.code,
      message: app.status === ERROR_CODES.INTERNAL_ERROR && env.isProduction ? 'Erro interno.' : app.message,
      requestId: req.requestId,
    },
  };
  if (app.details !== undefined) corpo.error.details = app.details;

  res.status(app.status).json(corpo);
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError('NOT_FOUND', `Rota ${req.method} ${req.path} não existe.`));
};
