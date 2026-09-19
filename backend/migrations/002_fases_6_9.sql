-- Fase 6-9: endereços, favoritos, avaliações, devoluções, cupons, notificações, mensagens, suporte

-- ========== FASE 6: Conta do utilizador ==========

-- Endereços múltiplos
CREATE TABLE enderecos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  nome            text NOT NULL, -- "Casa", "Trabalho", etc.
  destinatario    text NOT NULL,
  telefone        text NOT NULL,
  morada          text NOT NULL,
  codigo_postal   text,
  cidade          text NOT NULL,
  ponto_referencia text,
  observacoes     text,
  principal       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX enderecos_utilizador_idx ON enderecos (utilizador_id, principal DESC, created_at DESC);

-- Favoritos / Wishlist
CREATE TABLE favoritos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  produto_id      uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (utilizador_id, produto_id)
);

CREATE INDEX favoritos_utilizador_idx ON favoritos (utilizador_id, created_at DESC);
CREATE INDEX favoritos_produto_idx ON favoritos (produto_id);

-- ========== FASE 7: Pós-venda ==========

-- Estados de pedido expandidos (já existe enum `estado_pedido`, mas adicionamos rastreamento)
CREATE TABLE rastreamento_pedido (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado          estado_pedido NOT NULL,
  descricao       text,
  localizacao     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rastreamento_pedido_idx ON rastreamento_pedido (pedido_id, created_at DESC);

-- Devoluções
CREATE TYPE estado_devolucao AS ENUM ('solicitada', 'aprovada', 'rejeitada', 'recebida', 'reembolsada');

CREATE TABLE devolucoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  produto_id      uuid REFERENCES produtos(id) ON DELETE SET NULL,
  motivo          text NOT NULL,
  descricao       text,
  fotos           jsonb DEFAULT '[]'::jsonb,
  estado          estado_devolucao NOT NULL DEFAULT 'solicitada',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX devolucoes_utilizador_idx ON devolucoes (utilizador_id, created_at DESC);
CREATE INDEX devolucoes_pedido_idx ON devolucoes (pedido_id);

-- Avaliações (só após compra confirmada)
CREATE TABLE avaliacoes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id        uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  utilizador_id     uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  pedido_id         uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estrelas_produto  integer NOT NULL CHECK (estrelas_produto BETWEEN 1 AND 5),
  estrelas_entrega  integer CHECK (estrelas_entrega IS NULL OR estrelas_entrega BETWEEN 1 AND 5),
  comentario        text,
  fotos             jsonb DEFAULT '[]'::jsonb,
  verificada        boolean NOT NULL DEFAULT false, -- admin pode moderar
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (utilizador_id, pedido_id, produto_id) -- uma avaliação por produto por pedido
);

CREATE INDEX avaliacoes_produto_idx ON avaliacoes (produto_id, created_at DESC) WHERE verificada;
CREATE INDEX avaliacoes_utilizador_idx ON avaliacoes (utilizador_id, created_at DESC);

-- ========== FASE 8: Engagement ==========

-- Cupons
CREATE TYPE tipo_cupao AS ENUM ('percentual', 'fixo');

CREATE TABLE cupons (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo            text NOT NULL UNIQUE,
  descricao         text,
  tipo              tipo_cupao NOT NULL,
  valor             integer NOT NULL CHECK (valor > 0), -- percentual (10 = 10%) ou cêntimos
  minimo_centimos   integer DEFAULT 0,
  maximo_utilizacoes integer, -- NULL = ilimitado
  utilizacoes       integer NOT NULL DEFAULT 0,
  valido_de         timestamptz NOT NULL DEFAULT now(),
  valido_ate        timestamptz NOT NULL,
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cupons_codigo_idx ON cupons (lower(codigo)) WHERE activo;

-- Cupons por utilizador (rastreamento)
CREATE TABLE cupons_utilizador (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cupao_id        uuid NOT NULL REFERENCES cupons(id) ON DELETE CASCADE,
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  pedido_id       uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cupons_utilizador_idx ON cupons_utilizador (utilizador_id, created_at DESC);

-- Notificações
CREATE TYPE tipo_notificacao AS ENUM (
  'pedido', 'pagamento', 'envio', 'entrega',
  'promocao', 'cupao', 'preco', 'stock', 'mensagem', 'sistema'
);

CREATE TABLE notificacoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  tipo            tipo_notificacao NOT NULL,
  titulo          text NOT NULL,
  mensagem        text NOT NULL,
  link            text,
  lida            boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notificacoes_utilizador_idx ON notificacoes (utilizador_id, lida, created_at DESC);

-- Mensagens (cliente ↔ suporte)
CREATE TABLE mensagens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id    uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  destinatario_id uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  assunto         text NOT NULL,
  corpo           text NOT NULL,
  lida            boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mensagens_destinatario_idx ON mensagens (destinatario_id, lida, created_at DESC);
CREATE INDEX mensagens_remetente_idx ON mensagens (remetente_id, created_at DESC);

-- ========== FASE 9: Suporte ==========

-- Tickets de suporte
CREATE TYPE estado_ticket AS ENUM ('aberto', 'em_analise', 'resolvido', 'fechado');
CREATE TYPE categoria_ticket AS ENUM ('pedido', 'pagamento', 'entrega', 'devolucao', 'produto', 'conta', 'outro');

CREATE TABLE tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  categoria       categoria_ticket NOT NULL,
  assunto         text NOT NULL,
  descricao       text NOT NULL,
  estado          estado_ticket NOT NULL DEFAULT 'aberto',
  prioridade      text DEFAULT 'normal', -- baixa, normal, alta
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tickets_utilizador_idx ON tickets (utilizador_id, created_at DESC);
CREATE INDEX tickets_estado_idx ON tickets (estado, created_at DESC);

-- Respostas de tickets
CREATE TABLE respostas_ticket (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  utilizador_id   uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  mensagem        text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX respostas_ticket_idx ON respostas_ticket (ticket_id, created_at ASC);

-- FAQ
CREATE TABLE faq (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria       text NOT NULL,
  pergunta        text NOT NULL,
  resposta        text NOT NULL,
  ordem           integer NOT NULL DEFAULT 0,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX faq_categoria_idx ON faq (categoria, ordem) WHERE activo;

-- Adicionar campo de garantia em produtos (opcional, para Fase 9)
ALTER TABLE produtos ADD COLUMN garantia_meses integer CHECK (garantia_meses IS NULL OR garantia_meses > 0);
