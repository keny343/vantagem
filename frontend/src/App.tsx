import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './auth/SessionContext';
import { CartProvider } from './cart/CartContext';
import { AdminLayout } from './layout/AdminLayout';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PedidoPage } from './pages/PedidoPage';
import { ProdutoPage } from './pages/ProdutoPage';
import ContaDashboardPage from './pages/ContaDashboardPage';
import FavoritosPage from './pages/FavoritosPage';
import PerfilPage from './pages/PerfilPage';
import PedidosPage from './pages/PedidosPage';
import EnderecosPage from './pages/EnderecosPage';
import CuponsPage from './pages/CuponsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProdutosPage } from './pages/admin/AdminProdutosPage';
import { AdminProdutoFormPage } from './pages/admin/AdminProdutoFormPage';
import { AdminCategoriasPage } from './pages/admin/AdminCategoriasPage';
import { AdminCuponsPage } from './pages/admin/AdminCuponsPage';
import { AdminPedidosPage } from './pages/admin/AdminPedidosPage';
import { AdminUtilizadoresPage } from './pages/admin/AdminUtilizadoresPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';
import { AdminPedidoPage } from './pages/admin/AdminPedidoPage';
import { LegalPage } from './pages/LegalPage';
import { ContaDeCliente, SemCompraDeAdmin } from './auth/papeis';
import { AjudaPage } from './pages/AjudaPage';
import { RegistoPage } from './pages/RegistoPage';
import { RecuperarPage } from './pages/RecuperarPage';
import { RedefinirPage } from './pages/RedefinirPage';
import { FacturaPage } from './pages/FacturaPage';
import SuportePage from './pages/SuportePage';
import TicketPage from './pages/TicketPage';
import DevolucoesPage from './pages/DevolucoesPage';
import { AvisosProvider } from './ui/Avisos';
import { ConfirmarProvider } from './ui/Confirmar';

export function App() {
  return (
    <SessionProvider>
      <CartProvider>
        <AvisosProvider>
        <ConfirmarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/produto/:id" element={<ProdutoPage />} />
            <Route
              path="/carrinho"
              element={
                <SemCompraDeAdmin>
                  <CarrinhoPage />
                </SemCompraDeAdmin>
              }
            />
            <Route
              path="/checkout"
              element={
                <SemCompraDeAdmin>
                  <CheckoutPage />
                </SemCompraDeAdmin>
              }
            />
            <Route path="/pedido/:referencia/factura" element={<FacturaPage />} />
            <Route path="/pedido/:referencia" element={<PedidoPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registo" element={<RegistoPage />} />
            <Route path="/recuperar" element={<RecuperarPage />} />
            <Route path="/redefinir" element={<RedefinirPage />} />
            <Route path="/empresa" element={<LegalPage />} />
            <Route path="/termos" element={<LegalPage />} />
            <Route path="/devolucoes" element={<LegalPage />} />
            <Route path="/privacidade" element={<LegalPage />} />
            <Route path="/ajuda" element={<AjudaPage />} />
            <Route
              path="/conta"
              element={
                <ContaDeCliente>
                  <ContaDashboardPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/favoritos"
              element={
                <ContaDeCliente>
                  <FavoritosPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/perfil"
              element={
                <ContaDeCliente>
                  <PerfilPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/pedidos"
              element={
                <ContaDeCliente>
                  <PedidosPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/enderecos"
              element={
                <ContaDeCliente>
                  <EnderecosPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/cupons"
              element={
                <ContaDeCliente>
                  <CuponsPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/suporte"
              element={
                <ContaDeCliente>
                  <SuportePage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/suporte/:id"
              element={
                <ContaDeCliente>
                  <TicketPage />
                </ContaDeCliente>
              }
            />
            <Route
              path="/conta/devolucoes"
              element={
                <ContaDeCliente>
                  <DevolucoesPage />
                </ContaDeCliente>
              }
            />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="produtos" element={<AdminProdutosPage />} />
              <Route path="produtos/novo" element={<AdminProdutoFormPage />} />
              <Route path="produtos/:slug" element={<AdminProdutoFormPage />} />
              <Route path="categorias" element={<AdminCategoriasPage />} />
              <Route path="cupons" element={<AdminCuponsPage />} />
              <Route path="pedidos" element={<AdminPedidosPage />} />
              <Route path="pedidos/:id" element={<AdminPedidoPage />} />
              <Route path="utilizadores" element={<AdminUtilizadoresPage />} />
              <Route path="tickets" element={<AdminTicketsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        </ConfirmarProvider>
        </AvisosProvider>
      </CartProvider>
    </SessionProvider>
  );
}
