import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, urlMedia, type AdminProduct, type ProductWrite } from '../../api/client';
import { useTitulo } from '../../hooks/useTitulo';
import { useAvisos } from '../../ui/Avisos';
import { onInputPt, onInvalidPt } from '../../utils/validacaoPt';

const vazio: ProductWrite = {
  name: '',
  brand: '',
  categorySlug: '',
  price: 0,
  oldPrice: null,
  stock: 0,
  description: '',
  specs: [],
  images: [],
  variantLabel: 'Opção',
  variantOptions: [],
  badge: null,
  featured: false,
  hero: false,
  warrantyMonths: 12,
};

const linhas = (lista: string[]) => lista.join('\n');
const parseLinhas = (texto: string) =>
  texto
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const soUmaVersao = (opcoes: string[]) =>
  opcoes.length === 0 || (opcoes.length === 1 && ['Único', 'Padrão', 'Opção'].includes(opcoes[0] ?? ''));

export function AdminProdutoFormPage() {
  const { slug } = useParams();
  const editar = Boolean(slug);
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductWrite>(vazio);
  const [categorias, setCategorias] = useState<{ slug: string; name: string }[]>([]);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const [aEnviarFoto, setAEnviarFoto] = useState(false);
  const [indiceSubstituir, setIndiceSubstituir] = useState<number | null>(null);
  const ficheiroRef = useRef<HTMLInputElement>(null);
  const { avisar } = useAvisos();
  useTitulo(editar ? 'Editar artigo' : 'Novo artigo');

  useEffect(() => {
    void api.adminCategorias().then((r) => setCategorias(r.categories));
  }, []);

  useEffect(() => {
    if (!slug) return;
    void api
      .adminProduto(slug)
      .then(({ product }) => aplicarProduto(product))
      .catch(() => setErro('Artigo não encontrado.'));
  }, [slug]);

  function aplicarProduto(p: AdminProduct) {
    setForm({
      name: p.name,
      brand: p.brand,
      categorySlug: p.categorySlug,
      price: p.price,
      oldPrice: p.oldPrice,
      stock: p.stock,
      description: p.description,
      specs: p.specs,
      images: p.images,
      variantLabel: p.variants.label,
      variantOptions: soUmaVersao(p.variants.options) ? [] : p.variants.options,
      badge: null,
      featured: p.featured,
      hero: p.hero,
      warrantyMonths: p.warrantyMonths,
      active: p.active,
    });
  }

  async function enviarFotografia(ficheiro: File, substituirEm: number | null) {
    setAEnviarFoto(true);
    setErro('');
    try {
      const { url } = await api.adminUploadFoto(ficheiro);
      setForm((actual) => {
        if (substituirEm !== null && substituirEm >= 0 && substituirEm < actual.images.length) {
          const imagens = [...actual.images];
          imagens[substituirEm] = url;
          return { ...actual, images: imagens };
        }
        return { ...actual, images: [...actual.images, url].slice(0, 8) };
      });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a fotografia.');
    } finally {
      setAEnviarFoto(false);
      setIndiceSubstituir(null);
      if (ficheiroRef.current) ficheiroRef.current.value = '';
    }
  }

  function escolherFicheiro(substituirEm: number | null) {
    setIndiceSubstituir(substituirEm);
    ficheiroRef.current?.click();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.images.length === 0) {
      setErro('Adiciona pelo menos uma fotografia do artigo.');
      return;
    }
    setSaving(true);
    setErro('');
    try {
      const body: ProductWrite = {
        ...form,
        variantLabel: 'Opção',
        variantOptions: form.variantOptions.length > 0 ? form.variantOptions : ['Único'],
        badge: null,
      };
      if (editar && slug) {
        const actualizado = await api.adminActualizarProduto(slug, body);
        avisar('Alterações guardadas.');
        void navigate(`/admin/produtos/${actualizado.product.slug}`);
      } else {
        await api.adminCriarProduto(body);
        avisar('Artigo publicado no catálogo.');
        void navigate('/admin/produtos');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const extra = err.details?.map((d) => d.message).join(' ') ?? '';
        setErro(`${err.message}${extra ? ` ${extra}` : ''}`);
      } else {
        setErro('Não foi possível guardar o artigo.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="label-mono">Catálogo</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
        {editar ? 'Editar artigo' : 'Novo artigo'}
      </h1>
      <Link to="/admin/produtos" className="mt-2 inline-block font-mono text-[11px] text-steel hover:text-acid">
        Lista de artigos
      </Link>
      {erro && <p className="mt-4 font-mono text-[11px] text-destructive">{erro}</p>}

      <form
        onSubmit={(e) => void onSubmit(e)}
        onInvalidCapture={onInvalidPt}
        onInput={onInputPt}
        className="mt-6 grid max-w-3xl gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome do artigo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Campo label="Marca" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} required />
        </div>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Categoria</span>
          <select
            required
            value={form.categorySlug}
            onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm"
          >
            <option value="">Escolhe a categoria…</option>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            label="Preço (Kz)"
            type="number"
            min={1}
            step={1}
            value={form.price === 0 ? '' : String(form.price)}
            onChange={(v) => setForm({ ...form, price: Number(v) })}
            required
          />
          <Campo
            label="Preço anterior (Kz)"
            type="number"
            min={1}
            step={1}
            value={form.oldPrice === null ? '' : String(form.oldPrice)}
            onChange={(v) => setForm({ ...form, oldPrice: v === '' ? null : Number(v) })}
          />
          <Campo
            label="Unidades em stock"
            type="number"
            min={0}
            step={1}
            value={String(form.stock)}
            onChange={(v) => setForm({ ...form, stock: Number(v) })}
            required
          />
        </div>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Descrição</span>
          <textarea
            required
            minLength={10}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Explica o que o cliente está a comprar, em linguagem simples."
            className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
          />
        </label>

        <div>
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">Fotografias</span>
          <p className="mt-1 font-mono text-[10px] text-steel">
            JPG, PNG ou WEBP até 5 MB. A primeira fotografia é a capa na loja.
          </p>
          <input
            ref={ficheiroRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const ficheiro = e.target.files?.[0];
              if (ficheiro) void enviarFotografia(ficheiro, indiceSubstituir);
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            {form.images.map((src, i) => (
              <div key={`${src}-${i}`} className="relative size-24 overflow-hidden rounded-lg border border-line">
                <img src={urlMedia(src)} alt="" className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex bg-black/60">
                  <button
                    type="button"
                    onClick={() => escolherFicheiro(i)}
                    className="flex-1 py-1 font-mono text-[9px] text-ink uppercase"
                  >
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, images: form.images.filter((_, j) => j !== i) })
                    }
                    className="flex-1 py-1 font-mono text-[9px] text-destructive uppercase"
                  >
                    Tirar
                  </button>
                </div>
              </div>
            ))}
            {form.images.length < 8 && (
              <button
                type="button"
                disabled={aEnviarFoto}
                onClick={() => escolherFicheiro(null)}
                className="grid size-24 place-items-center rounded-lg border border-dashed border-line font-mono text-[10px] text-steel uppercase hover:text-acid disabled:opacity-60"
              >
                {aEnviarFoto ? 'A enviar…' : 'Adicionar'}
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
            Características (opcional)
          </span>
          <p className="mt-1 font-mono text-[10px] text-steel">Uma por linha. Ex.: Ecrã 15,6 pol.</p>
          <textarea
            rows={3}
            value={linhas(form.specs)}
            onChange={(e) => setForm({ ...form, specs: parseLinhas(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
            Versões do artigo (opcional)
          </span>
          <p className="mt-1 font-mono text-[10px] text-steel">
            Se o artigo tem tamanhos ou cores, separa por vírgula. Caso contrário, deixa em branco.
          </p>
          <input
            value={form.variantOptions.join(', ')}
            onChange={(e) =>
              setForm({
                ...form,
                variantOptions: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Ex.: 128 GB, 256 GB"
            className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm outline-none focus:border-acid/60"
          />
        </label>
        <Campo
          label="Garantia (meses)"
          type="number"
          min={1}
          max={120}
          value={form.warrantyMonths === null ? '' : String(form.warrantyMonths)}
          onChange={(v) => setForm({ ...form, warrantyMonths: v === '' ? null : Number(v) })}
        />
        <label className="flex items-start gap-2 font-mono text-[11px] text-steel">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.hero}
            onChange={(e) =>
              setForm({
                ...form,
                hero: e.target.checked,
                featured: e.target.checked ? true : form.featured,
              })
            }
          />
          <span>
            Artigo da capa da loja
            <span className="mt-1 block text-[10px] text-steel/80">
              Aparece no início do site, como destaque. Só pode haver um de cada vez.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 font-mono text-[11px] text-steel">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            disabled={form.hero}
          />
          Mostrar na grelha da página inicial
        </label>
        {editar && (
          <label className="flex items-center gap-2 font-mono text-[11px] text-steel">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Visível no catálogo
          </label>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            disabled={saving || aEnviarFoto}
            className="h-11 max-w-xs rounded-lg bg-acid px-6 font-display text-sm font-semibold text-canvas disabled:opacity-60"
          >
            {saving ? 'A guardar…' : editar ? 'Guardar alterações' : 'Publicar artigo'}
          </button>
          <Link
            to="/admin/produtos"
            className="grid h-11 place-items-center px-4 font-mono text-[11px] text-steel uppercase hover:text-acid"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = 'text',
  required,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">{label}</span>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-line bg-panel2 px-3 text-sm outline-none focus:border-acid/60"
      />
    </label>
  );
}
