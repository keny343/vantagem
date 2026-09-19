import { Router } from 'express';
import * as contaController from '../controllers/conta.controller.js';
import { requerAutenticacao, requerPapel } from '../middleware/authenticate.js';

const router = Router();

router.use(requerAutenticacao, requerPapel('cliente'));

// Dashboard
router.get('/dashboard', contaController.obterDashboard);

// Perfil
router.get('/perfil', contaController.obterPerfil);
router.patch('/perfil', contaController.actualizarPerfil);

// Endereços
router.get('/enderecos', contaController.listarEnderecos);
router.post('/enderecos', contaController.criarEndereco);
router.patch('/enderecos/:id', contaController.actualizarEndereco);
router.delete('/enderecos/:id', contaController.eliminarEndereco);
router.post('/enderecos/:id/principal', contaController.marcarEnderecoPrincipal);

// Favoritos
router.get('/favoritos', contaController.listarFavoritos);
router.post('/favoritos', contaController.adicionarFavorito);
router.delete('/favoritos/:produtoId', contaController.removerFavorito);

export default router;
