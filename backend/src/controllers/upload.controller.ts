import type { Request, Response } from 'express';
import multer from 'multer';
import { guardarFicheiro } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';
import { exigirImagemSegura } from '../utils/imagemSegura.js';
import { exigirPdfComprovativo, PDF_MAX_BYTES } from '../utils/pdfSeguro.js';

const tiposImagem = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadFotoProduto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const nome = file.originalname.toLowerCase();
    if (nome.includes('..') || nome.includes('/') || nome.includes('\\')) {
      cb(new Error('Nome de ficheiro inválido.'));
      return;
    }
    if (!tiposImagem.has(file.mimetype)) {
      cb(new Error('Só são aceites fotografias JPG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
}).single('fotografia');

/** Comprovativos de transferência: apenas PDF. */
export const uploadComprovativoPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PDF_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const nome = file.originalname.toLowerCase();
    if (nome.includes('..') || nome.includes('/') || nome.includes('\\')) {
      cb(new Error('Nome de ficheiro inválido.'));
      return;
    }
    const mime = file.mimetype.toLowerCase();
    const extOk = nome.endsWith('.pdf');
    if (mime !== 'application/pdf' && mime !== 'application/x-pdf' && !extOk) {
      cb(new Error('Só são aceites comprovativos em PDF.'));
      return;
    }
    cb(null, true);
  },
}).single('comprovativo');

const validarBufferImagem = (req: Request): void => {
  if (req.file === undefined || !req.file.buffer) {
    throw new AppError('VALIDATION_ERROR', 'Escolhe uma fotografia para enviar.');
  }
  const mimeReal = exigirImagemSegura(req.file.buffer, req.file.mimetype);
  req.file.mimetype = mimeReal;
};

export const validarUploadComprovativo = (req: Request): void => {
  if (req.file === undefined || !req.file.buffer) {
    throw new AppError('VALIDATION_ERROR', 'Envia o PDF do comprovativo.');
  }
  const mimeReal = exigirPdfComprovativo(req.file.buffer, req.file.mimetype || 'application/pdf');
  req.file.mimetype = mimeReal;
};

export const guardarFotoProduto = async (req: Request, res: Response): Promise<void> => {
  validarBufferImagem(req);
  const ficheiro = req.file!;
  const url = await guardarFicheiro({
    buffer: ficheiro.buffer,
    mimetype: ficheiro.mimetype,
    originalname: ficheiro.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
  });
  res.status(201).json({ url });
};

export const validarUploadImagem = validarBufferImagem;
