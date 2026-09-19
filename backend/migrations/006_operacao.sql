-- Registo, recuperação de senha, comprovativo de transferência e FAQ inicial.

CREATE TABLE IF NOT EXISTS tokens_recuperacao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  used_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tokens_recuperacao_user_idx
  ON tokens_recuperacao (utilizador_id, expires_at DESC);

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comprovativo_url text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagamento_externo_id text;

CREATE TABLE IF NOT EXISTS eventos_pagamento (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  referencia      text NOT NULL,
  origem          text NOT NULL,
  estado          text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO faq (categoria, pergunta, resposta, ordem)
SELECT v.categoria, v.pergunta, v.resposta, v.ordem
FROM (VALUES
  ('Comprar', 'Como faço uma encomenda?', 'Entra ou cria conta, escolhe os artigos no catálogo, finaliza a compra e indica a morada em Angola.', 1),
  ('Comprar', 'Quais os pagamentos?', 'Multicaixa Express, referência Multicaixa ou transferência bancária. Em produção o operador confirma o pagamento; em demonstração podes confirmar na página da encomenda.', 2),
  ('Envio', 'Para onde enviam?', 'Luanda e províncias. Envio grátis a partir de 50 000 Kz.', 3),
  ('Conta', 'Esqueci a palavra-passe.', 'Em Entrar, escolhe Recuperar palavra-passe. Enviamos um link válido por uma hora.', 4),
  ('Devoluções', 'Como devolvo um artigo?', 'Na conta, em Devoluções, pede a devolução até 14 dias após a entrega.', 5)
) AS v(categoria, pergunta, resposta, ordem)
WHERE NOT EXISTS (SELECT 1 FROM faq LIMIT 1);
