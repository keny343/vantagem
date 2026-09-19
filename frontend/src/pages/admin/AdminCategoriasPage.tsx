import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api, type AdminCategory } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { useConfirmar } from '../../ui/Confirmar';
import { onInputPt, onInvalidPt } from '../../utils/validacaoPt';

export function AdminCategoriasPage() {
  const [lista, setLista] = useState<AdminCategory[]>([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState(0);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const { avisar } = useAvisos();
  const { confirmar } = useConfirmar();
  useTitulo('Categorias');

  async function carregar() {
    const r = await api.adminCategorias();
    setLista(r.categories);
  }

  useEffect(() => {
    void carregar().catch(() => setErro('Não foi possível carregar as categorias.'));
  }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await api.adminCriarCategoria({ name, order });
      setName('');
      setMsg('Categoria criada.');
      avisar('Categoria criada.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao criar categoria.');
    }
  }

  async function guardar(c: AdminCategory) {
    try {
      await api.adminActualizarCategoria(c.slug, { name: c.name, order: c.order });
      setMsg('Categoria actualizada.');
      avisar('Categoria actualizada.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao actualizar.');
    }
  }

  async function eliminar(slug: string) {
    const ok = await confirmar({
      titulo: 'Eliminar categoria',
      mensagem: 'Só é possível se não tiver artigos. Esta acção não se anula.',
      confirmarLabel: 'Eliminar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.adminEliminarCategoria(slug);
      avisar('Categoria eliminada.');
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao eliminar.');
    }
  }

  return (
    <div>
      <p className="label-mono">Catálogo</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-white">Categorias</h1>
      <p className="mt-1 font-mono text-[11px] text-steel">
        Organizam o catálogo público. Não se elimina uma categoria com produtos associados.
      </p>
      {msg && <p className="mt-4 font-mono text-[11px] text-acid">{msg}</p>}
      {erro && <p className="mt-4 font-mono text-[11px] text-destructive">{erro}</p>}

      <form
        onSubmit={(e) => void criar(e)}
        onInvalidCapture={onInvalidPt}
        onInput={onInputPt}
        className="mt-6 flex max-w-xl flex-wrap gap-3"
      >
        <input
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova categoria"
          className="h-10 flex-1 rounded-lg border border-line bg-panel2 px-3 text-sm"
        />
        <input
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="h-10 w-20 rounded-lg border border-line bg-panel2 px-3 text-sm"
          aria-label="Ordem"
        />
        <button className="h-10 rounded-lg bg-acid px-4 font-display text-sm font-semibold text-ink">
          Criar
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-panel">
        {lista.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-0">
            <input
              value={c.name}
              onChange={(e) =>
                setLista((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))
              }
              className="h-9 min-w-[160px] flex-1 rounded-md border border-line bg-panel2 px-2 text-sm"
            />
            <input
              type="number"
              value={c.order}
              onChange={(e) =>
                setLista((prev) =>
                  prev.map((x) => (x.id === c.id ? { ...x, order: Number(e.target.value) } : x)),
                )
              }
              className="h-9 w-20 rounded-md border border-line bg-panel2 px-2 text-sm"
            />
            <span className="font-mono text-[10px] text-steel">{c.productCount} artigos</span>
            <button
              type="button"
              onClick={() => void guardar(c)}
              className="h-9 rounded-md bg-acid px-3 font-mono text-[10px] text-ink uppercase"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => void eliminar(c.slug)}
              className="h-9 rounded-md px-3 font-mono text-[10px] text-destructive uppercase ring-1 ring-line"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
