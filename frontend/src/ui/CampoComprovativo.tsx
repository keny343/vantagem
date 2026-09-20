import { useId } from 'react';
import { urlMedia } from '../api/client';

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = 512;

export function validarComprovativo(ficheiro: File): string | null {
  const tipo = ficheiro.type.toLowerCase();
  const nome = ficheiro.name.toLowerCase();
  const extPdf = nome.endsWith('.pdf');
  const mimePdf = tipo === 'application/pdf' || tipo === 'application/x-pdf' || tipo === '';
  if (!extPdf || !mimePdf) {
    return 'Só são aceites comprovativos em PDF (não fotografias).';
  }
  if (ficheiro.size < MIN_BYTES) {
    return 'O PDF parece incompleto. Envia o comprovativo completo do banco.';
  }
  if (ficheiro.size > MAX_BYTES) {
    return 'O PDF não pode ter mais de 5 MB.';
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
  const obrigatorio = required && !urlEnviada;
  const rotulo = aEnviar
    ? 'A enviar…'
    : ficheiro || urlEnviada
      ? 'Trocar PDF'
      : 'Escolher PDF';

  return (
    <div className="rounded-lg border border-dashed border-acid/50 bg-panel2 p-4">
      <span className="font-mono text-[10px] tracking-[0.14em] text-steel uppercase">
        PDF do comprovativo{obrigatorio ? ' (obrigatório)' : ''}
      </span>
      <p className="mt-1 text-sm text-ink/70">
        Anexa o comprovativo da transferência em PDF (512 B–5 MB). Fotografias e outros formatos são
        rejeitados.
      </p>
      <div className="relative mt-3 inline-block">
        <span
          aria-hidden
          className={`inline-flex h-10 items-center rounded-lg bg-acid px-4 font-display text-sm font-semibold text-canvas ${
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
          accept="application/pdf,.pdf"
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
        <p className="mt-2 font-mono text-[11px] text-acid">
          {ficheiro.name} · {(ficheiro.size / 1024).toFixed(0)} KB
        </p>
      )}
      {urlEnviada && !ficheiro && (
        <p className="mt-2 font-mono text-[11px] text-acid">
          Comprovativo já enviado.{' '}
          <a
            href={urlMedia(urlEnviada)}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink"
          >
            Abrir PDF
          </a>
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
