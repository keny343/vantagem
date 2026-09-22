-- Histórico de estados do pedido (auditoria operacional).
-- Não é rastreio de transportadora (removido em 008_sem_rastreio.sql).

CREATE TABLE IF NOT EXISTS historico_estado_pedido (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado          estado_pedido NOT NULL,
  descricao       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS historico_estado_pedido_idx
  ON historico_estado_pedido (pedido_id, created_at DESC);
