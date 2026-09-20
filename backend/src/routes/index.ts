import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import * as catalog from '../controllers/catalog.controller.js';
import * as checkout from '../controllers/checkout.controller.js';
import * as admin from '../controllers/admin.controller.js';
import * as upload from '../controllers/upload.controller.js';
import * as pagamento from '../controllers/pagamento.controller.js';
import { bloquearComprasDeAdmin, requerAutenticacao, requerPapel } from '../middleware/authenticate.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import contaRouter from './conta.routes.js';

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
        'Demasiadas tentativas a partir deste endereço. Tenta mais tarde.',
      ),
    );
  },
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('RATE_LIMITED', 'Demasiadas encomendas. Espera um pouco e tenta outra vez.'));
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('RATE_LIMITED', 'Demasiados envios de fotografias. Tenta mais tarde.'));
  },
});

const cupaoLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.isTest ? 1000 : 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError('RATE_LIMITED', 'Demasiadas validações de cupão. Tenta dentro de momentos.'));
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

apiRouter.post('/auth/registo', loginLimiter, (req, res, next) => {
  void auth.registo(req, res).catch(next);
});
apiRouter.post('/auth/recuperar', loginLimiter, (req, res, next) => {
  void auth.recuperar(req, res).catch(next);
});
apiRouter.post('/auth/redefinir', loginLimiter, (req, res, next) => {
  void auth.redefinir(req, res).catch(next);
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

apiRouter.get('/loja', (req, res, next) => {
  try {
    checkout.dadosLoja(req, res);
  } catch (erro) {
    next(erro);
  }
});
apiRouter.post('/cupons/validar', cupaoLimiter, bloquearComprasDeAdmin, (req, res, next) => {
  void checkout.validarCupao(req, res).catch(next);
});
apiRouter.post('/pedidos', checkoutLimiter, bloquearComprasDeAdmin, (req, res, next) => {
  void checkout.criarPedido(req, res).catch(next);
});
apiRouter.get('/pedidos/meus', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void checkout.meusPedidos(req, res).catch(next);
});
apiRouter.get('/pedidos/:referencia', (req, res, next) => {
  void checkout.obterPedido(req, res).catch(next);
});
apiRouter.post(
  '/pedidos/:referencia/comprovativo',
  uploadLimiter,
  bloquearComprasDeAdmin,
  (req, res, next) => {
    upload.uploadFotoProduto(req, res, (erro: unknown) => {
      if (erro) {
        next(erro);
        return;
      }
      void checkout.enviarComprovativo(req, res).catch(next);
    });
  },
);
apiRouter.get('/pagamentos/config', (req, res, next) => {
  try {
    pagamento.dadosPagamento(req, res);
  } catch (erro) {
    next(erro);
  }
});
apiRouter.post('/pagamentos/webhook', (req, res, next) => {
  void pagamento.webhook(req, res).catch(next);
});

apiRouter.use('/conta', contaRouter);

// Devoluções e avaliações
apiRouter.get('/conta/devolucoes', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/posVenda.controller.js').then((m) => m.listarDevolucoes(req, res, next));
});
apiRouter.post('/conta/devolucoes', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/posVenda.controller.js').then((m) => m.criarDevolucao(req, res, next));
});
apiRouter.post('/conta/avaliacoes', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/posVenda.controller.js').then((m) => m.criarAvaliacao(req, res, next));
});
apiRouter.get('/produtos/:produtoId/avaliacoes', (req, res, next) => {
  void import('../controllers/posVenda.controller.js').then((m) => m.listarAvaliacoesProduto(req, res, next));
});

// Cupons e notificações
apiRouter.get('/conta/cupons', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/engagement.controller.js').then((m) => m.listarCupons(req, res, next));
});
apiRouter.post('/conta/cupons/validar', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/engagement.controller.js').then((m) => m.validarCupao(req, res, next));
});
apiRouter.get('/conta/notificacoes', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/engagement.controller.js').then((m) => m.listarNotificacoes(req, res, next));
});
apiRouter.patch('/conta/notificacoes/:id/lida', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/engagement.controller.js').then((m) => m.marcarNotificacaoLida(req, res, next));
});
apiRouter.patch('/conta/notificacoes/lidas', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/engagement.controller.js').then((m) => m.marcarTodasLidas(req, res, next));
});

// Suporte e FAQ
apiRouter.get('/conta/tickets', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/suporte.controller.js').then((m) => m.listarTickets(req, res, next));
});
apiRouter.post('/conta/tickets', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/suporte.controller.js').then((m) => m.criarTicket(req, res, next));
});
apiRouter.get('/conta/tickets/:id', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/suporte.controller.js').then((m) => m.obterTicket(req, res, next));
});
apiRouter.post('/conta/tickets/:id/respostas', requerAutenticacao, requerPapel('cliente'), (req, res, next) => {
  void import('../controllers/suporte.controller.js').then((m) => m.responderTicket(req, res, next));
});
apiRouter.get('/faq', (req, res, next) => {
  void import('../controllers/suporte.controller.js').then((m) => m.listarFAQ(req, res, next));
});

apiRouter.post(
  '/admin/upload',
  uploadLimiter,
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    upload.uploadFotoProduto(req, res, (erro: unknown) => {
      if (erro) {
        next(erro);
        return;
      }
      void upload.guardarFotoProduto(req, res).catch(next);
    });
  },
);
apiRouter.get('/admin/resumo', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.resumo(req, res).catch(next);
});
apiRouter.get('/admin/produtos', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarProdutos(req, res).catch(next);
});
apiRouter.patch('/admin/hero', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.definirHero(req, res).catch(next);
});
apiRouter.get('/admin/pedidos', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarPedidos(req, res).catch(next);
});
apiRouter.get(
  '/admin/pedidos/:id',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.obterPedido(req, res).catch(next);
  },
);
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
apiRouter.get('/admin/utilizadores', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarUtilizadores(req, res).catch(next);
});
apiRouter.get('/admin/tickets', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarTickets(req, res).catch(next);
});
apiRouter.get('/admin/tickets/:id', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void import('../controllers/suporte.controller.js').then((m) =>
    m.obterTicketAdmin(req, res, next),
  );
});
apiRouter.post(
  '/admin/tickets/:id/respostas',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void import('../controllers/suporte.controller.js').then((m) =>
      m.responderTicketAdmin(req, res, next),
    );
  },
);
apiRouter.patch('/admin/tickets/:id', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.actualizarTicket(req, res).catch(next);
});
apiRouter.patch(
  '/admin/utilizadores/:id',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.actualizarUtilizador(req, res).catch(next);
  },
);
apiRouter.get('/admin/categorias', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarCategorias(req, res).catch(next);
});
apiRouter.post('/admin/categorias', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.criarCategoria(req, res).catch(next);
});
apiRouter.patch(
  '/admin/categorias/:slug',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.actualizarCategoria(req, res).catch(next);
  },
);
apiRouter.delete(
  '/admin/categorias/:slug',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.eliminarCategoria(req, res).catch(next);
  },
);
apiRouter.get('/admin/produtos/:slug', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.obterProduto(req, res).catch(next);
});
apiRouter.post('/admin/produtos', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.criarProduto(req, res).catch(next);
});
apiRouter.patch(
  '/admin/produtos/:slug',
  requerAutenticacao,
  requerPapel('admin'),
  (req, res, next) => {
    void admin.actualizarProduto(req, res).catch(next);
  },
);
apiRouter.get('/admin/cupons', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.listarCupons(req, res).catch(next);
});
apiRouter.post('/admin/cupons', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.criarCupao(req, res).catch(next);
});
apiRouter.patch('/admin/cupons/:id', requerAutenticacao, requerPapel('admin'), (req, res, next) => {
  void admin.actualizarCupao(req, res).catch(next);
});
