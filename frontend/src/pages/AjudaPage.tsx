import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { LOJA } from '../config/loja';

export function AjudaPage() {
  useTitulo('Ajuda');
  const [faq, setFaq] = useState<{ id: string; categoria: string; pergunta: string; resposta: string }[]>([]);
  useEffect(() => {
    void api.faq().then((r) => setFaq(r.faq)).catch(() => undefined);
  }, []);

  return (
    <StoreShell>
      <h1 className="mt-8 font-display text-2xl font-semibold text-white">Ajuda</h1>
      <p className="mt-2 max-w-[56ch] text-zinc-400">
        Como comprar, acompanhar a encomenda e o que cada tipo de conta pode fazer.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Seccao titulo="Como comprar">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Abre o catálogo e escolhe o artigo.</li>
            <li>Adiciona ao carrinho. Podes alterar quantidades ou anular a remoção.</li>
            <li>Entra na tua conta ou cria uma, se ainda não tiveres.</li>
            <li>Em Finalizar compra, indica a morada em Angola.</li>
            <li>No pagamento, transfere o valor, anexa a fotografia do comprovativo e confirma a encomenda.</li>
          </ol>
        </Seccao>
        <Seccao titulo="Pagamento e envio">
          <p>
            Transferência bancária para a conta da loja. Os preços já incluem IVA de{' '}
            {Math.round(LOJA.taxaIva * 100)}%. Envio em Angola; grátis a partir de 50 000 Kz. Express
            e referência Multicaixa vêm numa fase seguinte.
          </p>
          <p className="mt-2">
            Devolução em {LOJA.diasDevolucao} dias.{' '}
            <Link to="/devolucoes" className="text-acid hover:underline">
              Ver política
            </Link>
            .
          </p>
        </Seccao>
        <Seccao titulo="Conta de cliente">
          <p>
            Compras, moradas, favoritos e histórico de pedidos. Entra em{' '}
            <Link to="/login" className="text-acid hover:underline">
              Entrar
            </Link>
            .
          </p>
        </Seccao>
        <Seccao titulo="Conta de administrador">
          <p>
            Gere artigos, capa da loja, stock e pedidos. Esta conta não compra — serve só para
            ver e gerir a loja.
          </p>
        </Seccao>
        <Seccao titulo="Atalhos do teclado">
          <ul className="space-y-2">
            <li>
              <kbd className="rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[11px]">
                /
              </kbd>{' '}
              ir para a pesquisa
            </li>
            <li>
              <kbd className="rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[11px]">
                Esc
              </kbd>{' '}
              fechar o carrinho ou um diálogo
            </li>
          </ul>
        </Seccao>
        <Seccao titulo="Ainda precisas de ajuda?">
          <p>
            Abre uma conversa com a loja na tua conta — encomenda em atraso, artigo danificado ou
            outro problema.
          </p>
          <Link to="/conta/suporte" className="mt-3 inline-block font-mono text-[11px] text-acid uppercase">
            Falar com a loja
          </Link>
          <p className="mt-3">
            Ou escreve para {LOJA.email} / {LOJA.telefone}.
          </p>
        </Seccao>
        {faq.length > 0 && (
          <Seccao titulo="Perguntas frequentes">
            <dl className="space-y-3">
              {faq.map((f) => (
                <div key={f.id}>
                  <dt className="font-display text-white">{f.pergunta}</dt>
                  <dd className="mt-1">{f.resposta}</dd>
                </div>
              ))}
            </dl>
          </Seccao>
        )}
        <Seccao titulo="Erros frequentes">
          <ul className="space-y-2">
            <li>Formulário recusado: o aviso aparece junto do campo, em português.</li>
            <li>Artigo retirado por engano: usa Anular no aviso no topo da página.</li>
            <li>Página em branco ou falha de rede: Tentar outra vez ou volta ao catálogo.</li>
          </ul>
        </Seccao>
      </div>
    </StoreShell>
  );
}

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-panel p-5">
      <h2 className="font-display text-lg text-white">{titulo}</h2>
      <div className="mt-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}
