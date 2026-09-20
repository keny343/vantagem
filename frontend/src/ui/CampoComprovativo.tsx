import { useEffect, useId, useState } from 'react';
import { urlMedia } from '../api/client';

const ACEITES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;
const EXT_OK = /\.(jpe?g|png|webp|gif)$/i;

export function validarComprovativo(ficheiro: File): string | null {
  const tipo = ficheiro.type.toLowerCase();
  const nome = ficheiro.name.toLowerCase();
  if (/heic|heif/.test(tipo) || /\.hei[cf]$/.test(nome)) {
    return 'Esta fotografia está no formato HEIC. No telemóvel, grava-a como JPG ou escolhe outra foto.';
  }
  const tipoOk = ACEITES.has(tipo) || (tipo === '' && EXT_OK.test(nome));
  if (!tipoOk) {
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
  aEnviar = false,
}: {
  id?: string;
  ficheiro: File | null;
  onChange: (ficheiro: File | null) => void;
  required?: boolean;
  urlEnviada?: string | null;
  erro?: string;
  aEnviar?: boolean;
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
  const rotulo = aEnviar
    ? 'A enviar…'
    : ficheiro || urlEnviada
      ? 'Trocar fotografia'
      : 'Escolher fotografia';

  return (
    <div className="rounded-lg border border-dashed border-acid/50 bg-panel2 p-4">
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
        Fotografia do comprovativo{obrigatorio ? ' (obrigatório)' : ''}
      </span>
      <p className="mt-1 text-sm text-zinc-300">
        Anexa o comprovativo da transferência. JPG, PNG ou WEBP até 5 MB.
      </p>
      {/*
        O input fica por cima do botão (opacidade 0). O clique é nativo no
        <input type="file"> — display:none + .click() falha no desktop em Chromium.
      */}
      <div className="relative mt-3 inline-block">
        <span
          aria-hidden
          className={`inline-flex h-10 items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-ink ${
            aEnviar ? 'opacity-60' : ''
          }`}
        >
          {rotulo}
        </span>
        <input
          id={inputId}
          name="comprovativo"
          type="file"
          disabled={aEnviar}
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          aria-label={rotulo}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
          onChange={(e) => {
            const escolhido = e.target.files?.[0] ?? null;
            e.target.value = '';
            onChange(escolhido);
          }}
        />
      </div>
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
        <p role="alert" className="mt-2 font-mono text-[11px] text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
