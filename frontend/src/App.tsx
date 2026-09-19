import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './auth/SessionContext';
import { CartProvider } from './cart/CartContext';
import { AdminPage } from './pages/AdminPage';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContaPage } from './pages/ContaPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProdutoPage } from './pages/ProdutoPage';

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
            <Route path="/conta" element={<ContaPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </SessionProvider>
  );
}
