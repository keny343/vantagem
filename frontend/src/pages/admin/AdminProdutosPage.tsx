import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, urlMedia, type AdminProduct } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { useConfirmar } from '../../ui/Confirmar';
import { formatEuro } from '../../utils/format';
import { onInputPt, onInvalidPt } from '../../utils/validacaoPt';

export function AdminProdutosPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  useTitulo('Artigos');

  async function carregar() {
    const r = await api.adminProdutos();
    setProducts(r.products);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar os artigos.'));
  }, []);

  async function guardarStock(e: FormEvent<HTMLFormElement>, slug: string) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const quantity = Number(data.get('quantity'));
    await api.adminStock(slug, quantity);
    setMsg('Stock actualizado.');
    avisar('Stock actualizado.');
    await carregar();
  }

  async function toggleActivo(p: AdminProduct) {
    if (p.active) {
      const ok = await confirmar({
        titulo: 'Ocultar artigo',
        mensagem: `${p.name} deixa de aparecer no catálogo. Podes voltar a mostrá-lo depois.`,
        confirmarLabel: 'Ocultar',
        perigo: true,
      });
      if (!ok) return;
    }
    try {
      await api.adminActualizarProduto(p.slug, { active: !p.active });
      avisar(p.active ? 'Artigo oculto no catálogo.' : 'Artigo visível no catálogo.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível alterar o estado.');
    }
  }

  async function definirCapa(slug: string | null) {
    try {
      await api.adminDefinirHero(slug);
      const texto = slug ? 'Capa da loja actualizada.' : 'Artigo retirado da capa.';
      setMsg(texto);
      avisar(texto);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível alterar a capa.');
    }
  }

  const capa = products.find((p) => p.hero);
  const filtrados = products.filter((p) => {
    const n = q.trim().toLowerCase();
    if (!n) return true;
    return `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(n);
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono">Catálogo</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Artigos</h1>
          <p className="mt-1 font-mono text-[11px] text-steel">
            O que aparece aqui é o que está na base de dados — nada de exemplos fictícios.
          </p>
          {capa && (
            <p className="mt-2 font-mono text-[11px] text-acid">
              Capa da loja: {capa.name}
            </p>
          )}
        </div>
        <Link
          to="/admin/produtos/novo"
          className="grid h-10 place-items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
        >
          Novo artigo
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar por nome, marca ou categoria…"
        className="mt-6 h-10 w-full max-w-md rounded-lg border border-line bg-panel2 px-3 text-sm"
      />

      {msg && <p className="mt-4 font-mono text-[11px] text-acid">{msg}</p>}
      {erro && <p className="mt-4 font-mono text-[11px] text-destructive">{erro}</p>}

      {products.length === 0 ? (
        <div className="mt-6 rounded-[14px] border border-line bg-panel p-10 text-center">
          <p className="font-display text-lg text-ink">Ainda não há artigos</p>
          <p className="mt-2 font-mono text-[11px] text-steel">
            Começa por adicionar o primeiro. O catálogo público fica vazio até o publicares.
          </p>
          <Link
            to="/admin/produtos/novo"
            className="mt-5 inline-grid h-10 place-items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas"
          >
            Adicionar artigo
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-panel">
          {filtrados.map((p) => (
            <div
              key={p.slug}
              className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-b-0"
            >
              {p.images[0] && (
                <img
                  src={urlMedia(p.images[0])}
                  alt=""
                  className="size-12 rounded-md object-cover ring-1 ring-line"
                />
              )}
              <div className="min-w-[200px] flex-1">
                <div className="font-display text-ink">
                  {p.name}
                  {p.hero && (
                    <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-acid uppercase">
                      Capa
                    </span>
                  )}
                  {!p.active && (
                    <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-warn uppercase">
                      Oculto
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-steel">
                  {p.brand} · {p.category} · {formatEuro(p.price)}
                </div>
              </div>
              <form
                onSubmit={(e) => void guardarStock(e, p.slug)}
                onInvalidCapture={onInvalidPt}
                onInput={onInputPt}
                className="flex items-center gap-2"
              >
                <input
                  name="quantity"
                  type="number"
                  min={0}
                  defaultValue={p.stock}
                  className="h-9 w-20 rounded-md border border-line bg-panel2 px-2 font-mono text-sm"
                />
                <button className="h-9 rounded-md px-3 font-mono text-[10px] text-steel uppercase ring-1 ring-line">
                  Stock
                </button>
              </form>
              <Link
                to={`/admin/produtos/${p.slug}`}
                className="h-9 rounded-md px-3 font-mono text-[10px] leading-9 text-acid uppercase ring-1 ring-acid/40"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => void definirCapa(p.hero ? null : p.slug)}
                disabled={!p.active && !p.hero}
                className={`h-9 rounded-md px-3 font-mono text-[10px] uppercase ring-1 ${
                  p.hero
                    ? 'text-acid ring-acid/40'
                    : 'text-steel ring-line'
                } disabled:opacity-40`}
              >
                {p.hero ? 'Tirar da capa' : 'Pôr na capa'}
              </button>
              <button
                type="button"
                onClick={() => void toggleActivo(p)}
                className="h-9 rounded-md px-3 font-mono text-[10px] text-steel uppercase ring-1 ring-line"
              >
                {p.active ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
