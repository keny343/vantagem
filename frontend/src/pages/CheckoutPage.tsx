import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useSession } from '../auth/SessionContext';
import { LOJA, faltaParaEnvioGratis, ivaIncluidoDe } from '../config/loja';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { Campo } from '../ui/Campo';
import { formatEuro } from '../utils/format';
import { onInputPt, onInvalidPt } from '../utils/validacaoPt';

const field =
  'h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm text-zinc-100 outline-none placeholder:text-steel/60 focus:border-acid/60';

type Endereco = {
  id: string;
  nome: string;
  destinatario: string;
  telefone: string;
  morada: string;
  codigo_postal: string | null;
  cidade: string;
  principal: boolean;
};

const chaveIdem = (): string => {
  const existente = sessionStorage.getItem('vantagem_idem');
  if (existente) return existente;
  const nova = crypto.randomUUID();
  sessionStorage.setItem('vantagem_idem', nova);
  return nova;
};

export function CheckoutPage() {
  const cart = useCart();
  const { user } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [erro, setErro] = useState('');
  const [payment, setPayment] = useState<'cartao' | 'mbway' | 'multibanco'>('mbway');
  const [cupao, setCupao] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [cupaoOk, setCupaoOk] = useState('');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [aPagar, setAPagar] = useState(false);
  const alertaRef = useRef<HTMLDivElement>(null);
  useTitulo('Finalizar compra');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    postalCode: user?.postalCode ?? '',
    city: user?.city ?? 'Luanda',
    nif: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      name: f.name || user.name,
      email: f.email || user.email,
      phone: f.phone || user.phone || '',
      address: f.address || user.address || '',
      postalCode: f.postalCode || user.postalCode || '',
      city: f.city || user.city || '',
      nif: f.nif,
    }));
    void api
      .enderecos()
      .then((r) => setEnderecos(r.enderecos))
      .catch(() => undefined);
  }, [user]);

  const total = useMemo(
    () => Math.max(0, cart.subtotal - desconto) + cart.shipping,
    [cart.subtotal, cart.shipping, desconto],
  );
  const iva = ivaIncluidoDe(total);
  const faltaEnvio = faltaParaEnvioGratis(cart.subtotal);

  function aplicarEndereco(e: Endereco) {
    setForm((f) => ({
      ...f,
      name: e.destinatario || f.name,
      phone: e.telefone || f.phone,
      address: e.morada,
      postalCode: e.codigo_postal ?? '',
      city: e.cidade,
    }));
  }

  async function aplicarCupao() {
    setErro('');
    try {
      const r = await api.validarCupao(cupao, cart.subtotal);
      setDesconto(r.cupao.discount);
      setCupaoOk(r.cupao.code);
    } catch (err) {
      setDesconto(0);
      setCupaoOk('');
      setErro(err instanceof ApiError ? err.message : 'Cupão inválido.');
    }
  }

  async function pagar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (cart.lines.length === 0) {
      setErro('O carrinho está vazio.');
      return;
    }
    if (payment === 'mbway' && !form.phone.trim()) {
      setErro('O Express exige o telemóvel da conta.');
      return;
    }
    setAPagar(true);
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
          phone: form.phone,
          address: form.address,
          postalCode: form.postalCode,
          city: form.city,
          nif: form.nif || undefined,
        },
        paymentMethod: payment,
        couponCode: cupaoOk || undefined,
        idempotencyKey: chaveIdem(),
      });
      cart.clear();
      sessionStorage.removeItem('vantagem_idem');
      navigate(`/pedido/${encodeURIComponent(order.reference)}`);
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível reservar o pedido. Confirma os dados e tenta outra vez.',
      );
    } finally {
      setAPagar(false);
    }
  }

  useEffect(() => {
    if (erro) alertaRef.current?.focus();
  }, [erro]);

  return (
    <StoreShell>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Finalizar compra</h1>
          <p className="mt-1 font-mono text-[11px] text-steel">
            Entrega em {LOJA.pais} · preços em Kwanzas, com IVA incluído
          </p>
        </div>
        <Link to="/carrinho" className="font-mono text-[11px] text-steel uppercase hover:text-acid">
          Voltar ao carrinho
        </Link>
      </div>
      <ol className="mt-4 flex gap-2">
        {['Entrega', 'Pagamento'].map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i + 1)}
              aria-current={step === i + 1 ? 'step' : undefined}
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
            </button>
          </li>
        ))}
      </ol>
      {erro && (
        <div
          ref={alertaRef}
          role="alert"
          tabIndex={-1}
          className="mt-4 rounded-lg border border-destructive/40 px-4 py-3 font-mono text-[12px] text-destructive"
        >
          {erro}{' '}
          <Link to="/ajuda" className="text-acid">
            Ver ajuda
          </Link>
        </div>
      )}

      {cart.lines.length === 0 ? (
        <div className="mt-6 rounded-[14px] border border-line bg-panel p-8 text-center">
          <p className="font-display text-white">Não há artigos para pagar.</p>
          <Link to="/catalogo" className="mt-4 inline-block font-mono text-[11px] text-acid">
            Voltar ao catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[14px] border border-line bg-panel p-6">
            {step === 1 && (
              <form
                className="rise space-y-4"
                onInvalidCapture={onInvalidPt}
                onInput={onInputPt}
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
              >
                <div className="label-mono">Dados de entrega</div>
                {enderecos.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] text-steel uppercase">Moradas guardadas</p>
                    {enderecos.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => aplicarEndereco(e)}
                        className="block w-full rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-acid/40"
                      >
                        <span className="text-white">{e.nome}</span>
                        <span className="ml-2 font-mono text-[11px] text-steel">
                          {e.morada}, {e.cidade}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    id="chk-nome"
                    label="Nome completo"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Campo
                    id="chk-email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Campo
                    id="chk-morada"
                    label="Morada"
                    required
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <Campo
                    id="chk-postal"
                    label="Código postal"
                    hint="Opcional em Angola"
                    autoComplete="postal-code"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  />
                  <Campo
                    id="chk-cidade"
                    label="Cidade ou município"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                  <Campo
                    id="chk-tel"
                    label="Telemóvel"
                    required
                    autoComplete="tel"
                    hint="9xxxxxxxx ou +244 9xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Campo
                    id="chk-nif"
                    label="NIF"
                    hint="Opcional, para factura"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.nif}
                    onChange={(e) => setForm({ ...form, nif: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
                <p className="font-mono text-[10px] text-steel">
                  Entregamos em Luanda e nas províncias. Fora de Angola, fala connosco.
                </p>
                <button className="h-11 rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink">
                  Continuar para pagamento
                </button>
              </form>
            )}

            {step === 2 && (
              <form
                className="rise space-y-4"
                onInvalidCapture={onInvalidPt}
                onInput={onInputPt}
                onSubmit={(e) => void pagar(e)}
              >
                <div className="label-mono">Pagamento</div>
                <p className="text-sm text-zinc-400">
                  Entrega: {form.name} · {form.address}, {form.postalCode} {form.city}
                </p>
                <div className="space-y-2">
                  {(
                    [
                      ['mbway', 'Multicaixa Express'],
                      ['multibanco', 'Referência Multicaixa'],
                      ['cartao', 'Transferência bancária'],
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
                {payment === 'mbway' && (
                  <p className="font-mono text-[11px] text-steel">
                    Pedido Express para {form.phone || 'o telemóvel indicado'}. Confirmas o
                    pagamento na página seguinte.
                  </p>
                )}
                {payment === 'multibanco' && (
                  <p className="font-mono text-[11px] text-steel">
                    Geramos entidade e referência Multicaixa. O pedido fica pendente até o
                    pagamento ser confirmado.
                  </p>
                )}
                {payment === 'cartao' && (
                  <p className="font-mono text-[11px] text-steel">
                    Transferência para a conta da loja. Nenhum valor é cobrado automaticamente —
                    confirmas na página do pedido.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    className={field}
                    placeholder="Cupão"
                    value={cupao}
                    onChange={(e) => setCupao(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => void aplicarCupao()}
                    className="h-11 shrink-0 rounded-lg px-4 font-mono text-[11px] uppercase ring-1 ring-line hover:text-acid"
                  >
                    Aplicar
                  </button>
                </div>
                {cupaoOk && (
                  <p className="font-mono text-[11px] text-acid">
                    {cupaoOk} · −{formatEuro(desconto)}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-11 rounded-lg px-5 font-mono text-xs tracking-[0.12em] text-zinc-300 uppercase ring-1 ring-line"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={aPagar}
                    className="h-11 rounded-lg bg-acid px-6 font-display text-sm font-semibold text-ink disabled:opacity-60"
                  >
                    {aPagar ? 'A reservar…' : `Reservar e pagar ${formatEuro(total)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="self-start rounded-[14px] border border-line bg-panel p-5">
            <div className="label-mono mb-4">Resumo</div>
            <div className="space-y-3">
              {cart.lines.map((l) => (
                <div key={l.id + l.variant} className="flex justify-between font-mono text-[11px]">
                  <span className="text-steel">
                    {l.qty}× {l.name}
                  </span>
                  <span className="text-zinc-200">{formatEuro(l.price * l.qty)}</span>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 font-mono text-[11px] text-steel">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-zinc-200">{formatEuro(cart.subtotal)}</dd>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between">
                  <dt>Desconto</dt>
                  <dd className="text-acid">−{formatEuro(desconto)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Envio</dt>
                <dd className="text-zinc-200">
                  {cart.shipping === 0 ? 'Grátis' : formatEuro(cart.shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>IVA incluído ({Math.round(LOJA.taxaIva * 100)}%)</dt>
                <dd className="text-zinc-200">{formatEuro(iva)}</dd>
              </div>
            </dl>
            {faltaEnvio > 0 && (
              <p className="mt-3 font-mono text-[10px] text-steel">
                Faltam {formatEuro(faltaEnvio)} para envio grátis.
              </p>
            )}
            <div className="mt-4 flex items-center justify-between font-display text-lg text-white">
              <span>Total</span>
              <span>{formatEuro(total)}</span>
            </div>
          </aside>
        </div>
      )}
    </StoreShell>
  );
}
