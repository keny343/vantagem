import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './auth/SessionContext';
import { CartProvider } from './cart/CartContext';
import { AdminPage } from './pages/AdminPage';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProdutoPage } from './pages/ProdutoPage';
import ContaDashboardPage from './pages/ContaDashboardPage';
import FavoritosPage from './pages/FavoritosPage';
import PerfilPage from './pages/PerfilPage';

export function App() {
  return (
    <SessionProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/produto/:id" element={<ProdutoPage />} />
            <Route path="/carrinho" element={<CarrinhoPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/conta" element={<ContaDashboardPage />} />
            <Route path="/conta/favoritos" element={<FavoritosPage />} />
            <Route path="/conta/perfil" element={<PerfilPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </SessionProvider>
  );
}
