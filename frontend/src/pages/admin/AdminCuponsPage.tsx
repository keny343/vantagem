import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api, type AdminCoupon } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { Campo } from '../../ui/Campo';
import { useConfirmar } from '../../ui/Confirmar';
import { ErroBloco } from '../../ui/ErroBloco';
import { formatEuro } from '../../utils/format';
import { onInputPt, onInvalidPt } from '../../utils/validacaoPt';

export function AdminCuponsPage() {
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  useTitulo('Cupons');
  const [lista, setLista] = useState<AdminCoupon[]>([]);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentual' | 'fixo'>('percentual');
  const [value, setValue] = useState(10);
  const [minEuros, setMinEuros] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [erro, setErro] = useState('');
  const [aCriar, setACriar] = useState(false);

  async function carregar() {
    setErro('');
    const r = await api.adminCupons();
    setLista(r.coupons);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar os cupons.'));
  }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setACriar(true);
    try {
      await api.adminCriarCupao({
        code: code.toUpperCase(),
        type,
        value,
        minEuros,
        validUntil: new Date(validUntil).toISOString(),
      });
      setCode('');
      avisar('Cupão criado.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao criar cupão.');
    } finally {
      setACriar(false);
    }
  }

  async function alternar(c: AdminCoupon) {
    if (c.active) {
      const ok = await confirmar({
        titulo: 'Desactivar cupão?',
        mensagem: `${c.code} deixa de poder ser usado no checkout.`,
        confirmarLabel: 'Desactivar',
        perigo: true,
      });
      if (!ok) return;
    }
    try {
      await api.adminActualizarCupao(c.id, !c.active);
      avisar(c.active ? 'Cupão desactivado.' : 'Cupão activado.');
      await carregar();
    } catch {
      setErro('Não foi possível actualizar o cupão.');
    }
  }

  return (
    <div>
      <p className="label-mono">Promoções</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">Cupons</h1>
      {erro && (
        <div className="mt-4">
          <ErroBloco mensagem={erro} onTentar={() => void carregar()} />
        </div>
      )}

      <form
        onSubmit={(e) => void criar(e)}
        onInvalidCapture={onInvalidPt}
        onInput={onInputPt}
        className="mt-6 grid max-w-xl gap-3"
      >
        <Campo
          id="cupao-codigo"
          label="Código"
          hint="O cliente escreve este código ao finalizar a compra."
          required
          minLength={3}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="VANTAGEM10"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block" htmlFor="cupao-tipo">
            <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Tipo</span>
            <select
              id="cupao-tipo"
              value={type}
              onChange={(e) => setType(e.target.value as 'percentual' | 'fixo')}
              className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm"
            >
              <option value="percentual">Percentagem (%)</option>
              <option value="fixo">Valor fixo (Kz)</option>
            </select>
          </label>
          <Campo
            id="cupao-valor"
            label={type === 'percentual' ? 'Percentagem' : 'Valor (Kz)'}
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <Campo
          id="cupao-minimo"
          label="Compra mínima (Kz)"
          type="number"
          min={0}
          value={minEuros}
          onChange={(e) => setMinEuros(Number(e.target.value))}
        />
        <Campo
          id="cupao-validade"
          label="Válido até"
          type="date"
          required
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
        <button
          disabled={aCriar}
          className="h-10 max-w-xs rounded-lg bg-acid font-display text-sm font-semibold text-ink disabled:opacity-60"
        >
          {aCriar ? 'A criar…' : 'Criar cupão'}
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-[14px] border border-line bg-panel">
        {lista.length === 0 && (
          <p className="p-6 font-mono text-[11px] text-steel">Ainda não há cupons.</p>
        )}
        {lista.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 last:border-0">
            <div>
              <p className="font-mono text-sm tracking-[0.14em] text-acid uppercase">{c.code}</p>
              <p className="mt-1 font-mono text-[11px] text-steel">
                {c.type === 'percentual' ? `${c.value}%` : formatEuro(c.value / 100)} · mín.{' '}
                {formatEuro(c.minEuros)} · até {new Date(c.validUntil).toLocaleDateString('pt-AO')} ·{' '}
                {c.uses} usos · {c.active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void alternar(c)}
              className="h-9 rounded-md px-3 font-mono text-[10px] uppercase ring-1 ring-line"
            >
              {c.active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
