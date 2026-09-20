-- Remover rastreio de encomendas: a loja não gere códigos de transportadora.

DROP TABLE IF EXISTS rastreamento_pedido;

ALTER TABLE pedidos DROP COLUMN IF EXISTS tracking;
