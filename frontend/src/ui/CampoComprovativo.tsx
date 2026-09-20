import { useEffect, useId, useState } from 'react';
import { urlMedia } from '../api/client';

const ACEITES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

export function validarComprovativo(ficheiro: File): string | null {
  if (!ACEITES.includes(ficheiro.type)) {
    return 'Só são aceites fotografias JPG, PNG ou WEBP.';
  }
  if (ficheiro.size > MAX_BYTES) {
    return 'A fotografia não pode ter mais de 5 MB.';
  }
  return null;
}

export function CampoComprovativo({
  id,
  ficheiro,
  onChange,
  required = false,
  urlEnviada = null,
  erro,
}: {
  id?: string;
  ficheiro: File | null;
  onChange: (ficheiro: File | null) => void;
  required?: boolean;
  urlEnviada?: string | null;
  erro?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ficheiro) {
      setLocalUrl(null);
      return;
    }
    const url = URL.createObjectURL(ficheiro);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [ficheiro]);

  const preview = localUrl ?? (urlEnviada ? urlMedia(urlEnviada) : null);
  const obrigatorio = required && !urlEnviada;

  return (
    <div className="rounded-lg border border-dashed border-acid/50 bg-panel2 p-4">
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
        Fotografia do comprovativo{obrigatorio ? ' (obrigatório)' : ''}
      </span>
      <p className="mt-1 text-sm text-zinc-300">
        Anexa o comprovativo da transferência. JPG, PNG ou WEBP até 5 MB.
      </p>
      <label
        htmlFor={inputId}
        className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-ink hover:brightness-95"
      >
        {ficheiro || urlEnviada ? 'Trocar fotografia' : 'Escolher fotografia'}
      </label>
      <input
        id={inputId}
        name="comprovativo"
        type="file"
        required={obrigatorio}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
        }}
      />
      {ficheiro && (
        <p className="mt-2 font-mono text-[11px] text-acid">{ficheiro.name}</p>
      )}
      {urlEnviada && !ficheiro && (
        <p className="mt-2 font-mono text-[11px] text-acid">Comprovativo já enviado.</p>
      )}
      {preview && (
        <img
          src={preview}
          alt="Pré-visualização do comprovativo"
          className="mt-3 max-h-48 rounded-lg border border-line object-contain"
        />
      )}
      {erro && (
        <p className="mt-2 font-mono text-[11px] text-destructive">{erro}</p>
      )}
    </div>
  );
}
