import { useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { useAvisos } from '../ui/Avisos';
import { useCart, type CartLine } from './CartContext';
import { guardarArtigoPendente } from './pendente';

export function useAdicionarAoCarrinho() {
  const { user } = useSession();
  const cart = useCart();
  const navigate = useNavigate();
  const { avisar } = useAvisos();

  return (item: Omit<CartLine, 'qty'>, qty = 1) => {
    if (!user) {
      guardarArtigoPendente(item, qty);
      navigate('/login');
      return;
    }
    cart.add(item, qty);
    avisar(`${item.name} foi para o carrinho.`);
  };
}
