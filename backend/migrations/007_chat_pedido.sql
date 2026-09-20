ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS pedido_referencia text;

CREATE INDEX IF NOT EXISTS tickets_pedido_referencia_idx
  ON tickets (utilizador_id, pedido_referencia)
  WHERE pedido_referencia IS NOT NULL;
