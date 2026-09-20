import { FormEvent, useEffect, useRef, useState } from 'react';

export type MensagemChat = {
  id: string;
  texto: string;
  createdAt: string;
  autorNome: string;
  papel: 'cliente' | 'admin';
};

export function Conversa({
  mensagens,
  papelEu,
  onEnviar,
  fechado,
  placeholder = 'Escreve uma mensagem…',
}: {
  mensagens: MensagemChat[];
  papelEu: 'cliente' | 'admin';
  onEnviar: (texto: string) => Promise<void>;
  fechado?: boolean;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const fundo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fundo.current?.scrollTo({ top: fundo.current.scrollHeight, behavior: 'smooth' });
  }, [mensagens.length]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpo = texto.trim();
    if (!limpo || aEnviar) return;
    setAEnviar(true);
    try {
      await onEnviar(limpo);
      setTexto('');
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[14px] border border-line bg-panel">
      <div ref={fundo} className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensagens.map((m) => {
          const minha = m.papel === papelEu;
          return (
            <article
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                minha ? 'ml-auto bg-acid/15 text-white' : 'bg-panel2 text-zinc-200'
              }`}
            >
              <p className="font-mono text-[10px] tracking-[0.12em] text-steel uppercase">
                {minha ? 'Tu' : m.papel === 'admin' ? 'Loja' : m.autorNome}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{m.texto}</p>
              <p className="mt-2 font-mono text-[10px] text-steel">
                {new Date(m.createdAt).toLocaleString('pt-PT')}
              </p>
            </article>
          );
        })}
      </div>
      {fechado ? (
        <p className="border-t border-line px-4 py-3 font-mono text-[11px] text-steel">
          Esta conversa está fechada.
        </p>
      ) : (
        <form onSubmit={(e) => void enviar(e)} className="flex gap-2 border-t border-line p-3">
          <textarea
            required
            rows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholder}
            className="min-h-11 flex-1 resize-none rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            disabled={aEnviar}
            className="h-11 self-end rounded-lg bg-acid px-4 font-display text-sm font-semibold text-ink disabled:opacity-60"
          >
            {aEnviar ? '…' : 'Enviar'}
          </button>
        </form>
      )}
    </div>
  );
}
