import type { Request, Response } from 'express';
import multer from 'multer';
import { guardarFicheiro } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';
import { exigirImagemSegura } from '../utils/imagemSegura.js';

const tipos = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadFotoProduto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const nome = file.originalname.toLowerCase();
    if (nome.includes('..') || nome.includes('/') || nome.includes('\\')) {
      cb(new Error('Nome de ficheiro inválido.'));
      return;
    }
    if (!tipos.has(file.mimetype)) {
      cb(new Error('Só são aceites fotografias JPG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
}).single('fotografia');

const validarBuffer = (req: Request): void => {
  if (req.file === undefined || !req.file.buffer) {
    throw new AppError('VALIDATION_ERROR', 'Escolhe uma fotografia para enviar.');
  }
  const mimeReal = exigirImagemSegura(req.file.buffer, req.file.mimetype);
  req.file.mimetype = mimeReal;
};

export const guardarFotoProduto = async (req: Request, res: Response): Promise<void> => {
  validarBuffer(req);
  const ficheiro = req.file!;
  const url = await guardarFicheiro({
    buffer: ficheiro.buffer,
    mimetype: ficheiro.mimetype,
    originalname: ficheiro.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
  });
  res.status(201).json({ url });
};

export const validarUploadImagem = validarBuffer;
