import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useSession } from '../auth/SessionContext';
import { StoreShell } from '../layout/StoreShell';
import { formatEuro } from '../utils/format';

const field =
  'h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm text-zinc-100 outline-none placeholder:text-steel/60 focus:border-acid/60';

export function CheckoutPage() {
  const cart = useCart();
  const { user } = useSession();
  const [step, setStep] = useState(1);
  const [erro, setErro] = useState('');
  const [referencia, setReferencia] = useState('');
  const [payment, setPayment] = useState<'cartao' | 'mbway' | 'multibanco'>('cartao');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    postalCode: user?.postalCode ?? '',
    city: user?.city ?? '',
  });

  async function pagar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (cart.lines.length === 0) {
      setErro('O carrinho está vazio.');
      return;
    }
    try {
      const { order } = await api.criarPedido({
        items: cart.lines.map((l) => ({
          productId: l.id,
          variant: l.variant,
          quantity: l.qty,
        })),
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address,
          postalCode: form.postalCode,
          city: form.city,
        },
        paymentMethod: payment,
      });
      setReferencia(order.reference);
      cart.clear();
      setStep(3);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha no checkout.');
    }
  }

  return (
    <StoreShell>
      <h1 className="mt-8 font-display text-2xl font-semibold text-white">Checkout</h1>
      <ol className="mt-4 flex gap-2">
        {['Entrega', 'Pagamento', 'Confirmação'].map((label, i) => (
          <li
            key={label}
            className={`flex h-9 items-center gap-2 rounded-md px-3 font-mono text-[10px] tracking-[0.12em] uppercase ${
              step === i + 1
                ? 'bg-acid text-ink'
                : step > i + 1
                  ? 'text-acid ring-1 ring-acid/40'
                  : 'text-steel ring-1 ring-line'
            }`}
          >
            <span>0{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[14px] border border-line bg-panel p-6">
          {step === 1 && (
            <form
              className="rise space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <div className="label-mono">Dados de entrega</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className={field}
                  placeholder="Nome completo"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className={field}
                  type="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Morada"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Código postal"
                  required
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Cidade"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <button className="h-11 rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink">
                Continuar para pagamento
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="rise space-y-4" onSubmit={(e) => void pagar(e)}>
              <div className="label-mono">Pagamento</div>
              <div className="space-y-2">
                {(
                  [
                    ['cartao', 'Cartão'],
                    ['mbway', 'MB WAY'],
                    ['multibanco', 'Multibanco'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-panel2 px-4 py-3 text-sm hover:border-acid/40"
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={payment === value}
                      onChange={() => setPayment(value)}
                      className="accent-acid"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {payment === 'cartao' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className={field} placeholder="Número do cartão (demo)" />
                  <input className={field} placeholder="MM/AA · CVC (demo)" />
                </div>
              )}
              {erro && <p className="font-mono text-[11px] text-destructive">{erro}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-11 rounded-lg px-5 font-mono text-xs tracking-[0.12em] text-zinc-300 uppercase ring-1 ring-line"
                >
                  Voltar
                </button>
                <button className="h-11 rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink">
                  Pagar {formatEuro(cart.total)}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="rise text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-acid/15 font-display text-acid">
                ✓
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-white">Pedido registado</h2>
              <p className="mt-2 font-mono text-[11px] text-steel">
                Referência {referencia} · receberás o email de confirmação em instantes.
              </p>
              <Link
                to="/conta"
                className="mt-6 inline-grid h-11 place-items-center rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink"
              >
                Seguir entrega
              </Link>
            </div>
          )}
        </div>

        <aside className="self-start rounded-[14px] border border-line bg-panel p-5">
          <div className="label-mono mb-4">Resumo</div>
          <div className="space-y-3">
            {cart.lines.length === 0 && step !== 3 && (
              <p className="font-mono text-[11px] text-steel">Sem artigos no carrinho.</p>
            )}
            {cart.lines.map((l) => (
              <div key={l.id + l.variant} className="flex justify-between font-mono text-[11px]">
                <span className="text-steel">
                  {l.qty}× {l.name}
                </span>
                <span className="text-zinc-200">{formatEuro(l.price * l.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-display text-lg text-white">
            <span>Total</span>
            <span>{formatEuro(step === 3 ? 0 : cart.total)}</span>
          </div>
        </aside>
      </div>
    </StoreShell>
  );
}
