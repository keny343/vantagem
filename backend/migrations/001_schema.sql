-- Vantagem marketplace schema.
-- Money is integer cêntimos. Stock lives in its own table so checkout can lock
-- a row without rewriting product catalogue fields.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE categorias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  nome        text NOT NULL UNIQUE,
  ordem       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE produtos (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text NOT NULL UNIQUE,
  sku                    text NOT NULL UNIQUE,
  nome                   text NOT NULL,
  marca                  text NOT NULL,
  categoria_id           uuid NOT NULL REFERENCES categorias(id),
  preco_centimos         integer NOT NULL CHECK (preco_centimos >= 0),
  preco_antigo_centimos  integer CHECK (preco_antigo_centimos IS NULL OR preco_antigo_centimos >= 0),
  descricao              text NOT NULL,
  badge                  text,
  featured               boolean NOT NULL DEFAULT false,
  vendidos               integer NOT NULL DEFAULT 0 CHECK (vendidos >= 0),
  variante_label         text NOT NULL DEFAULT 'Opção',
  variante_opcoes        jsonb NOT NULL DEFAULT '[]'::jsonb,
  specs                  jsonb NOT NULL DEFAULT '[]'::jsonb,
  imagens                jsonb NOT NULL DEFAULT '[]'::jsonb,
  activo                 boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX produtos_categoria_idx ON produtos (categoria_id) WHERE activo;
CREATE INDEX produtos_marca_idx ON produtos (marca) WHERE activo;
CREATE INDEX produtos_featured_idx ON produtos (featured) WHERE activo AND featured;
CREATE INDEX produtos_preco_idx ON produtos (preco_centimos) WHERE activo;

-- Separate stock table: checkout locks this row (FOR UPDATE) while creating the order.
CREATE TABLE stock (
  produto_id      uuid PRIMARY KEY REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade      integer NOT NULL CHECK (quantidade >= 0),
  actualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE perfil_utilizador AS ENUM ('cliente', 'admin');

CREATE TABLE utilizadores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  password_hash   text NOT NULL,
  nome            text NOT NULL,
  telefone        text,
  perfil          perfil_utilizador NOT NULL DEFAULT 'cliente',
  morada          text,
  codigo_postal    text,
  cidade          text,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT utilizadores_email_lower CHECK (email = lower(email))
);

CREATE INDEX utilizadores_perfil_idx ON utilizadores (perfil) WHERE activo;

-- Opaque server-side sessions. Only the hash is stored.
CREATE TABLE sessoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id uuid NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  ip            inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz
);

CREATE INDEX sessoes_utilizador_idx ON sessoes (utilizador_id) WHERE revoked_at IS NULL;
CREATE INDEX sessoes_expiry_idx ON sessoes (expires_at) WHERE revoked_at IS NULL;

-- Login throttling must survive deploys and work across instances.
CREATE TABLE tentativas_login (
  id          bigserial PRIMARY KEY,
  email       text NOT NULL,
  ip          inet,
  succeeded   boolean NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tentativas_login_email_idx ON tentativas_login (lower(email), created_at DESC);
CREATE INDEX tentativas_login_ip_idx ON tentativas_login (ip, created_at DESC);

CREATE TYPE estado_pedido AS ENUM (
  'pendente',
  'pago',
  'em_preparacao',
  'enviado',
  'entregue',
  'cancelado'
);

CREATE TYPE metodo_pagamento AS ENUM ('cartao', 'mbway', 'multibanco');

CREATE TABLE pedidos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia           text NOT NULL UNIQUE,
  utilizador_id        uuid REFERENCES utilizadores(id) ON DELETE SET NULL,
  estado               estado_pedido NOT NULL DEFAULT 'pendente',
  metodo_pagamento     metodo_pagamento NOT NULL,
  -- Snapshot of delivery details at order time (guest checkout allowed).
  cliente_nome         text NOT NULL,
  cliente_email        text NOT NULL,
  cliente_telefone     text,
  morada               text NOT NULL,
  codigo_postal         text NOT NULL,
  cidade               text NOT NULL,
  subtotal_centimos    integer NOT NULL CHECK (subtotal_centimos >= 0),
  envio_centimos       integer NOT NULL CHECK (envio_centimos >= 0),
  total_centimos       integer NOT NULL CHECK (total_centimos >= 0),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pedidos_utilizador_idx ON pedidos (utilizador_id, created_at DESC);
CREATE INDEX pedidos_estado_idx ON pedidos (estado, created_at DESC);
CREATE INDEX pedidos_email_idx ON pedidos (lower(cliente_email), created_at DESC);

CREATE TABLE itens_de_pedido (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id         uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id        uuid REFERENCES produtos(id) ON DELETE SET NULL,
  sku               text NOT NULL,
  nome              text NOT NULL,
  variante          text NOT NULL,
  quantidade        integer NOT NULL CHECK (quantidade > 0),
  preco_unitario_centimos integer NOT NULL CHECK (preco_unitario_centimos >= 0),
  total_centimos    integer NOT NULL CHECK (total_centimos >= 0)
);

CREATE INDEX itens_de_pedido_pedido_idx ON itens_de_pedido (pedido_id);
