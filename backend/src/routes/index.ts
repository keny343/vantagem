import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import * as catalog from '../controllers/catalog.controller.js';
import * as checkout from '../controllers/checkout.controller.js';
import * as admin from '../controllers/admin.controller.js';
import { requerAutenticacao, requerPapel } from '../middleware/authenticate.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const apiRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'RATE_LIMITED',
        'Demasiadas tentativas de login a partir deste endereço. Tenta mais tarde.',
      ),
    );
  },
});

apiRouter.get('/auth/csrf', (req, res) => {
  auth.csrf(req, res);
});

apiRouter.get('/categorias', (req, res, next) => {
  void catalog.getCategorias(req, res).catch(next);
});
apiRouter.get('/marcas', (req, res, next) => {
  void catalog.getMarcas(req, res).catch(next);
});
apiRouter.get('/produtos', (req, res, next) => {
  void catalog.getProdutos(req, res).catch(next);
});
apiRouter.get('/produtos/:slug', (req, res, next) => {
  void catalog.getProduto(req, res).catch(next);
});

apiRouter.post('/auth/login', loginLimiter, (req, res, next) => {
  void auth.login(req, res).catch(next);
});
apiRouter.post('/auth/logout', (req, res, next) => {
  void auth.logout(req, res).catch(next);
});
apiRouter.get('/auth/me', (req, res, next) => {
  void auth.me(req, res).catch(next);
});

apiRouter.post('/pedidos', (req, res, next) => {
  void checkout.criarPedido(req, res).catch(next);
});
apiRouter.get('/pedidos/meus', requerAutenticacao, (req, res, next) => {
  void checkout.meusPedidos(req, res).catch(next);
});
apiRouter.get('/pedidos/:referencia', (req, res, next) => {
  void checkout.obterPedido(req, res).catch(next);
});

apiRouter.get('/admin/resumo', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.resumo(req, res).catch(next);
});
apiRouter.get('/admin/produtos', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarProdutos(req, res).catch(next);
});
apiRouter.get('/admin/pedidos', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarPedidos(req, res).catch(next);
});
apiRouter.patch(
  '/admin/pedidos/:id/estado',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.actualizarEstado(req, res).catch(next);
  },
);
apiRouter.patch(
  '/admin/produtos/:slug/stock',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.actualizarStock(req, res).catch(next);
  },
);
