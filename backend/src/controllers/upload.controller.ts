import type { Request, Response } from 'express';
import multer from 'multer';
import { guardarFicheiro } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';

const tipos = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadFotoProduto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!tipos.has(file.mimetype)) {
      cb(new Error('Só são aceites fotografias JPG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
}).single('fotografia');

export const guardarFotoProduto = async (req: Request, res: Response): Promise<void> => {
  if (req.file === undefined || !req.file.buffer) {
    throw new AppError('VALIDATION_ERROR', 'Escolhe uma fotografia para enviar.');
  }
  const url = await guardarFicheiro({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
  });
  res.status(201).json({ url });
};
