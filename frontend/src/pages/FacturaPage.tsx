import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, type Order } from '../api/client';
import { LOJA } from '../config/loja';
import { useTitulo } from '../hooks/useTitulo';
import { formatEuro, ROTULO_ESTADO, ROTULO_PAGAMENTO } from '../utils/format';

export function FacturaPage() {
  const { referencia = '' } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [erro, setErro] = useState('');
  useTitulo(order ? `Factura ${order.reference}` : 'Factura');

  useEffect(() => {
    void api
      .pedido(referencia)
      .then((r) => setOrder(r.order))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          void navigate(`/login?seguir=${encodeURIComponent(`/pedido/${referencia}/factura`)}`);
          return;
        }
        setErro('Encomenda não encontrada.');
      });
  }, [referencia, navigate]);

  if (erro || !order) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <p className="text-steel">{erro || 'A carregar…'}</p>
        <Link to="/" className="mt-4 inline-block text-acid">
          Início
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] bg-white p-10 text-zinc-900 print:p-0">
      <div className="flex justify-between gap-6">
        <div>
          <p className="font-semibold">{LOJA.nomeLegal}</p>
          <p className="text-sm">NIF {LOJA.nif}</p>
          <p className="text-sm">{LOJA.morada}</p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-wider">Factura / recibo</p>
          <p className="font-semibold">{order.reference}</p>
          <p className="text-sm">{new Date(order.createdAt).toLocaleDateString('pt-AO')}</p>
        </div>
      </div>
      <div className="mt-8 text-sm">
        <p className="font-semibold">Cliente</p>
        <p>{order.customer.name}</p>
        <p>{order.customer.email}</p>
        <p>
          {order.customer.address}, {order.customer.city}
        </p>
        {order.nif && <p>NIF {order.nif}</p>}
      </div>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Artigo</th>
            <th>Qtd</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.sku + i.variant} className="border-b">
              <td className="py-2">
                {i.name} ({i.variant})
              </td>
              <td>{i.quantity}</td>
              <td className="text-right">{formatEuro(i.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatEuro(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>IVA incluído</dt>
          <dd>{formatEuro(order.vat)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Total</dt>
          <dd>{formatEuro(order.total)}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm">
        {ROTULO_PAGAMENTO[order.paymentMethod] ?? order.paymentMethod} · {ROTULO_ESTADO[order.status]}
      </p>
      <div className="mt-8 flex gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="h-10 rounded-lg bg-black px-4 text-sm text-white"
        >
          Imprimir / PDF
        </button>
        <Link to={`/pedido/${order.reference}`} className="grid h-10 place-items-center text-sm">
          Voltar à encomenda
        </Link>
      </div>
    </div>
  );
}
