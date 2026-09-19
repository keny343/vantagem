-- Loja da empresa: faturação, cupão no pedido, pagamento pendente, tracking.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS nif text,
  ADD COLUMN IF NOT EXISTS desconto_centimos integer NOT NULL DEFAULT 0 CHECK (desconto_centimos >= 0),
  ADD COLUMN IF NOT EXISTS iva_centimos integer NOT NULL DEFAULT 0 CHECK (iva_centimos >= 0),
  ADD COLUMN IF NOT EXISTS cupao_id uuid REFERENCES cupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cupao_codigo text,
  ADD COLUMN IF NOT EXISTS mb_entidade text,
  ADD COLUMN IF NOT EXISTS mb_referencia text,
  ADD COLUMN IF NOT EXISTS stock_reposto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pago_em timestamptz,
  ADD COLUMN IF NOT EXISTS tracking text,
  ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

ALTER TABLE cupons_utilizador
  ALTER COLUMN utilizador_id DROP NOT NULL;

INSERT INTO cupons (codigo, descricao, tipo, valor, minimo_centimos, valido_ate)
VALUES (
  'VANTAGEM10',
  '10% sobre o subtotal (mínimo 20 €). Demo da loja.',
  'percentual',
  10,
  2000,
  now() + interval '2 years'
)
ON CONFLICT (codigo) DO NOTHING;
