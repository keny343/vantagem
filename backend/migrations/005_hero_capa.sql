-- Um único artigo pode ocupar a capa (hero) da loja.

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS hero boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS produtos_hero_unico
  ON produtos ((true))
  WHERE hero;
