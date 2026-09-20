import { Link, useLocation } from 'react-router-dom';
import { LOJA } from '../config/loja';
import { useTitulo } from '../hooks/useTitulo';
import { StoreShell } from '../layout/StoreShell';
import { formatEuro } from '../utils/format';

const formatPrecoLegal = formatEuro;

const PAGINAS: Record<string, { titulo: string; corpo: string[] }> = {
  '/empresa': {
    titulo: 'A empresa',
    corpo: [
      `${LOJA.nomeLegal} opera a loja online ${LOJA.nome}, com sede em ${LOJA.morada}.`,
      `NIF ${LOJA.nif} (demonstração). Contacto: ${LOJA.email} · ${LOJA.telefone}.`,
      'Vendemos electrónica de consumo e profissional a particulares e empresas em Angola. Preços apresentados em Kwanzas, com IVA (14%) incluído.',
      'Não somos um marketplace: o catálogo, o stock e a factura são da mesma empresa.',
    ],
  },
  '/termos': {
    titulo: 'Termos e condições',
    corpo: [
      'Ao concluir uma encomenda aceitas estes termos. O contrato forma-se quando o pagamento é confirmado, não quando o stock é reservado.',
      `Entregas em Angola (Luanda e províncias). Custo de envio ${formatPrecoLegal(LOJA.custoEnvio)}, grátis a partir de ${formatPrecoLegal(LOJA.envioGratisAPartir)} de subtotal. Fora do país apenas sob consulta.`,
      'Métodos de pagamento: de momento transferência bancária. O cliente anexa a fotografia do comprovativo no formulário de compra; a loja verifica e confirma o pagamento. Multicaixa Express e referência Multicaixa serão ligados mais tarde.',
      'Reservamos o direito de cancelar encomendas por erro manifesto de preço ou falta de stock, com reposição do artigo e aviso ao cliente.',
    ],
  },
  '/devolucoes': {
    titulo: 'Devoluções e garantia',
    corpo: [
      `Tens ${LOJA.diasDevolucao} dias, a contar da entrega, para devolver compras à distância, nos termos da lei angolana aplicável ao comércio electrónico.`,
      'O artigo deve regressar completo, sem uso para além do necessário para o examinar. Software aberto, artigos personalizados e selos de higiene quebrados podem estar excluídos.',
      `A garantia legal mínima é de ${LOJA.garantiaMesesPadrao} meses, salvo indicação diferente na ficha do produto.`,
      `Para abrir uma devolução, responde à encomenda com o teu pedido em ${LOJA.email} ou, com conta, na área de cliente.`,
    ],
  },
  '/privacidade': {
    titulo: 'Privacidade',
    corpo: [
      'Tratamos nome, email, telemóvel, morada e NIF para cumprir o contrato de compra e as obrigações fiscais.',
      'A sessão usa cookie httpOnly. Não vendemos listas a terceiros. O acesso à página da encomenda pela referência revela os dados dessa encomenda — não partilhes a ligação.',
      `Para aceder, rectificar ou apagar dados, escreve para ${LOJA.email}.`,
    ],
  },
};

export function LegalPage() {
  const { pathname } = useLocation();
  const pag = PAGINAS[pathname] ?? PAGINAS['/empresa']!;
  useTitulo(pag.titulo);

  return (
    <StoreShell>
      <article className="mt-10 max-w-[62ch]">
        <p className="label-mono">Informação legal</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-white">{pag.titulo}</h1>
        <div className="mt-6 space-y-4 text-zinc-400">
          {pag.corpo.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <p className="mt-8 font-mono text-[11px] text-steel">
          <Link to="/empresa" className="hover:text-acid">
            Empresa
          </Link>
          {' · '}
          <Link to="/termos" className="hover:text-acid">
            Termos
          </Link>
          {' · '}
          <Link to="/devolucoes" className="hover:text-acid">
            Devoluções
          </Link>
          {' · '}
          <Link to="/privacidade" className="hover:text-acid">
            Privacidade
          </Link>
        </p>
      </article>
    </StoreShell>
  );
}
